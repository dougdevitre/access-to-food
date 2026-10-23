// @vitest-environment jsdom
//
// The Assistant's tool loop runs in the browser: when Claude asks for
// `searchPantries`, the page runs the tool, appends the `tool_result` turn and
// POSTs the whole history back. If that loop breaks, a person asking "find
// food near me" gets an error bubble instead of the 2-1-1 referral. The
// /api/assistant boundary (src/lib/api) is mocked; nothing here hits a server.
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type Anthropic from '@anthropic-ai/sdk';
import Assistant from '../src/pages/Assistant';

vi.mock('../src/lib/api', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/api')>('../src/lib/api');
  return {
    ...actual,
    postJson: vi.fn(),
    getConfigured: vi.fn(async () => true),
  };
});

import { ApiError, getConfigured, postJson } from '../src/lib/api';

const postJsonMock = vi.mocked(postJson);
const getConfiguredMock = vi.mocked(getConfigured);

const TOOL_USE_ID = 'toolu_01';

function toolUseResponse(searchTerm: string) {
  return {
    stop_reason: 'tool_use',
    content: [
      { type: 'text', text: 'Let me look that up.' },
      { type: 'tool_use', id: TOOL_USE_ID, name: 'searchPantries', input: { searchTerm } },
    ],
  };
}

function textResponse(text: string) {
  return { stop_reason: 'end_turn', content: [{ type: 'text', text }] };
}

function renderAssistant() {
  return render(
    <MemoryRouter>
      <Assistant />
    </MemoryRouter>,
  );
}

function sentHistory(callIndex: number): Anthropic.MessageParam[] {
  const [, body] = postJsonMock.mock.calls[callIndex] as unknown as [string, { messages: Anthropic.MessageParam[] }];
  return body.messages;
}

beforeEach(() => {
  postJsonMock.mockReset();
  getConfiguredMock.mockReset();
  getConfiguredMock.mockResolvedValue(true);
  // jsdom has no Element.scrollTo; the page scrolls the conversation panel.
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('Assistant tool loop', () => {
  it('runs searchPantries, appends the tool_result turn and POSTs it back', async () => {
    postJsonMock
      .mockResolvedValueOnce(toolUseResponse('63034'))
      .mockResolvedValueOnce(textResponse('Please dial 2-1-1 for pantries near you.'));

    renderAssistant();
    await screen.findByText('Find food near me');
    fireEvent.click(screen.getByText('Find food near me'));

    await screen.findByText('Please dial 2-1-1 for pantries near you.');
    expect(postJsonMock).toHaveBeenCalledTimes(2);

    // First POST: just the user's message.
    expect(postJsonMock.mock.calls[0][0]).toBe('/api/assistant');
    expect(sentHistory(0)).toEqual([{ role: 'user', content: 'Find food near me' }]);

    // Second POST: user turn, the assistant's tool_use turn, then the tool_result.
    const second = sentHistory(1);
    expect(second).toHaveLength(3);
    expect(second[0]).toEqual({ role: 'user', content: 'Find food near me' });
    expect(second[1]).toEqual({ role: 'assistant', content: toolUseResponse('63034').content });

    const toolTurn = second[2];
    expect(toolTurn.role).toBe('user');
    const blocks = toolTurn.content as Anthropic.ToolResultBlockParam[];
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('tool_result');
    expect(blocks[0].tool_use_id).toBe(TOOL_USE_ID);

    // The tool's result: no sample listings, a 2-1-1 referral and 911.
    const result = JSON.parse(blocks[0].content as string);
    expect(result.results).toEqual([]);
    expect(result.note).toMatch(/2-1-1/);
    expect(result.note).toMatch(/911/);
    expect(result.note).toMatch(/Do not name specific pantries/);
  });

  it('shows the final answer, not the interim tool-use text', async () => {
    postJsonMock
      .mockResolvedValueOnce(toolUseResponse('food'))
      .mockResolvedValueOnce(textResponse('Here is how to reach 2-1-1.'));

    renderAssistant();
    await screen.findByText('Find food near me');
    fireEvent.click(screen.getByText('Find food near me'));

    await screen.findByText('Here is how to reach 2-1-1.');
    expect(screen.queryByText('Let me look that up.')).toBeNull();
  });

  it('a plain answer with no tool call makes exactly one POST', async () => {
    postJsonMock.mockResolvedValueOnce(textResponse('SNAP eligibility depends on household size and income.'));

    renderAssistant();
    await screen.findByText('Am I eligible for SNAP?');
    fireEvent.click(screen.getByText('Am I eligible for SNAP?'));

    await screen.findByText('SNAP eligibility depends on household size and income.');
    expect(postJsonMock).toHaveBeenCalledTimes(1);
  });

  it('a not_configured error from the server shows the unavailable banner', async () => {
    postJsonMock.mockRejectedValueOnce(new ApiError(503, 'not_configured', 'No key'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderAssistant();
    await screen.findByText('Find food near me');
    fireEvent.click(screen.getByText('Find food near me'));

    await screen.findByText('AI Assistant Unavailable');
    await screen.findByText(/not configured on the server yet/);
    await waitFor(() => {
      expect((screen.getByLabelText('Message the assistant') as HTMLInputElement).disabled).toBe(true);
    });
  });

  it('any other failure shows a retry message and re-enables the input', async () => {
    postJsonMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderAssistant();
    await screen.findByText('Find food near me');
    fireEvent.click(screen.getByText('Find food near me'));

    await screen.findByText(/encountered an error/);
    await waitFor(() => {
      expect((screen.getByLabelText('Message the assistant') as HTMLInputElement).disabled).toBe(false);
    });
  });
});
