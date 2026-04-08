import { Info, ExternalLink, Phone, FileText, HelpCircle } from 'lucide-react';

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
      answer: 'Most pantries do not require appointments.'
    },
    {
      question: 'Should I bring money?',
      answer: 'Food assistance is free.'
    },
    {
      question: 'What should I bring?',
      answer: 'Reusable bags and ID if requested by the pantry.'
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
          <button className="bg-emerald-700 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-800 transition-colors shadow-sm">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
