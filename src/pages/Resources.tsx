import { Link } from 'react-router-dom';
import { Info, ExternalLink, Phone, FileText, HelpCircle, Apple, Salad, Droplets } from 'lucide-react';

export default function Resources() {
  const resources = [
    {
      title: 'WIC (Women, Infants, and Children)',
      description: 'Nutrition program for pregnant women, new mothers, and young children.',
      link: 'https://health.mo.gov/living/families/wic/',
      phone: '1-800-392-8209'
    },
    {
      title: 'Meals on Wheels',
      description: 'Home-delivered meals for seniors and individuals with disabilities.',
      link: 'https://www.mealsonwheelsamerica.org/',
      phone: '1-888-998-6325'
    },
    {
      title: 'United Way 2-1-1',
      description: 'Free, confidential service connecting people to local resources.',
      link: 'https://www.211.org/',
      phone: '211'
    },
    {
      title: 'St. Louis Area Foodbank',
      description: 'Learn more about our mission and programs.',
      link: 'https://stlfoodbank.org/',
      phone: '(314) 292-6262'
    }
  ];

  const faqs = [
    {
      question: 'Do I need an appointment?',
      answer: 'Most pantries do not require appointments. However, some may ask you to call ahead during peak times. Check the pantry details on our Partner Agencies page for specific instructions.'
    },
    {
      question: 'Should I bring money?',
      answer: 'No. Food assistance at all of our partner agencies is completely free. You will never be asked to pay for food at a distribution event or pantry.'
    },
    {
      question: 'What should I bring?',
      answer: 'Bring reusable bags or boxes to carry food home. Some pantries may ask for a photo ID or proof of address on your first visit, but this varies by location.'
    },
    {
      question: 'How often can I visit a pantry?',
      answer: 'Most partner agencies allow visits once per month, though some offer weekly distributions. Mobile markets and pop-up events are generally open to anyone without frequency limits.'
    },
    {
      question: 'Can I get food if I am undocumented?',
      answer: 'Yes. Our partner agencies do not ask about immigration status. Food assistance is available to everyone in our community regardless of documentation.'
    },
    {
      question: 'What types of food are available?',
      answer: 'Most pantries provide a mix of shelf-stable items (canned goods, pasta, rice), fresh produce, dairy, and proteins when available. Availability varies by location and season.'
    },
    {
      question: 'Can I receive food for someone else?',
      answer: 'In most cases, yes. Some pantries allow you to pick up food on behalf of a neighbor or family member. Call ahead to confirm their policy.'
    }
  ];

  const nutritionTips = [
    {
      icon: Apple,
      title: 'Stretch Fresh Produce',
      tips: [
        'Freeze ripe bananas, berries, and greens for smoothies',
        'Store leafy greens wrapped in a damp paper towel to extend freshness',
        'Use vegetable scraps (onion skins, carrot tops) to make broth'
      ]
    },
    {
      icon: Salad,
      title: 'Balanced Meals on a Budget',
      tips: [
        'Combine beans or lentils with rice for complete protein',
        'Add frozen vegetables to soups, stews, and pasta for nutrition',
        'Use canned fish (tuna, salmon) as an affordable protein source'
      ]
    },
    {
      icon: Droplets,
      title: 'Healthy Pantry Staples',
      tips: [
        'Keep oats, rice, dried beans, and canned tomatoes stocked',
        'Choose low-sodium canned vegetables when possible',
        'Peanut butter is shelf-stable and high in protein and healthy fats'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Community Resources</h1>
        <p className="text-stone-600 font-medium">Additional help and information for you and your family.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {resources.map((resource, index) => (
          <div key={index} className="bg-white rounded-3xl p-8 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col h-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-stone-50 p-3 rounded-2xl shrink-0 border border-stone-100">
                <Info className="w-6 h-6 text-stone-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 leading-tight">{resource.title}</h3>
              </div>
            </div>
            
            <p className="text-stone-600 mb-8 flex-grow font-medium">{resource.description}</p>
            
            <div className="space-y-4 pt-6 border-t border-stone-100">
              {resource.phone && (
                <a href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 text-stone-700 hover:text-emerald-700 font-semibold transition-colors">
                  <Phone className="w-5 h-5" />
                  {resource.phone}
                </a>
              )}
              {resource.link && (
                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-stone-700 hover:text-emerald-700 font-semibold transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Nutrition Tips</h2>
        <p className="text-stone-500 font-medium mb-8">Simple ways to make the most of the food you receive.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {nutritionTips.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                <div className="bg-emerald-100 p-3 rounded-xl w-fit mb-4">
                  <Icon className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-stone-800 text-lg mb-3">{section.title}</h3>
                <ul className="space-y-2">
                  {section.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} className="text-sm text-stone-600 font-medium flex items-start gap-2">
                      <span className="text-emerald-500 mt-1 shrink-0">&#8226;</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-10 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="text-2xl font-bold text-stone-800 mb-8">Food Assistance FAQ</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <h3 className="text-lg font-bold text-stone-800 mb-3 flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                {faq.question}
              </h3>
              <p className="text-stone-600 ml-9 font-medium">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 flex flex-col sm:flex-row items-center gap-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="bg-emerald-100 p-5 rounded-full shrink-0">
          <FileText className="w-10 h-10 text-emerald-700" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Need help navigating these resources?</h3>
          <p className="text-emerald-700 mb-6 font-medium">Our team can help connect you with the right programs for your situation.</p>
          <Link to="/assistant" className="inline-block bg-emerald-700 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-800 transition-colors shadow-sm">
            Chat with Our Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
