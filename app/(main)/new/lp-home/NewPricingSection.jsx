import React from "react";
import { Check } from "lucide-react";

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="10" r="10" fill="white" />
    <path
      d="M6 10L9 13L14 7"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 10h14"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.3"
    />
  </svg>
);

export default function NewPricingSection() {
  const plans = [
    { name: "Basic", price: "€10" },
    { name: "Pro", price: "€30" },
    { name: "Scale", price: "€100" },
  ];

  const features = [
    {
      category: null,
      items: [
        {
          name: "Custom domain",
          description: "Connect your own domain",
          values: [true, true, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Limits",
          description: "Scale with usage",
          values: [
            "Fixed",
            "Fixed",
            { text: "Flexible", sub: "pay what you use" },
          ],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Site pages",
          description: "Create custom designed pages",
          values: ["30", "150", { text: "300", sub: "then €20 per 100" }],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "CMS collections",
          description: "Store content in CMS collections",
          values: ["1", "10", { text: "20", sub: "then €40 per 10" }],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "CMS items",
          description: "Add CMS items to your collections",
          values: [
            "1,000",
            "2,500",
            { text: "10,000", sub: "then €20 per 10,000" },
          ],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Bandwidth usage",
          description: "Monthly bandwidth with overage alerts",
          values: [
            "10 GB",
            "100 GB",
            { text: "200 GB", sub: "then €40 per 100 GB" },
          ],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Hosting",
          description: "Global content delivery network for speed",
          values: ["20 locations", "20 locations", "300+ locations"],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Password protect",
          description: "Protect your site with a password",
          values: [true, true, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Site search",
          description: "Find anything on your site instantly",
          values: [false, true, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Site redirects",
          description: "Add redirects to maintain search engine rankings",
          values: [false, true, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Well-known files",
          description: "Host .well-known files on your site",
          values: [false, false, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Staging environment",
          description: "Test changes in staging before publishing",
          values: [false, false, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Advanced analytics",
          description: "Events, funnels, extended history, and UTM tracking",
          values: [false, false, true],
        },
      ],
    },
    {
      category: "Live collaboration",
      description:
        "Invite your team to collaborate on design, content, and publishing.",
      items: [],
    },
    {
      category: null,
      items: [
        {
          name: "Workspace owner",
          description: "One user who manages editors, projects, and billing",
          values: ["Free", "Free", "Free"],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Additional editors",
          description: "Design, edit content, and publish your site",
          values: ["€20 per editor", "€40 per editor", "€40 per editor"],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Seats",
          description: "The maximum number of users with edit access",
          values: ["2", "10", "10"],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Expert access",
          description: "Pro Experts get free edit access to client projects",
          values: [true, true, true],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Roles and permissions",
          description: "Manage who can view, edit content, design and deploy",
          values: [false, false, true],
        },
      ],
    },
    {
      category: "Add-ons",
      description:
        "From localizing your site to running multiple A/B-tests, power up your site with add-ons.",
      items: [],
    },
    {
      category: null,
      items: [
        {
          name: "Translation locales",
          description: "Translate your site into multiple languages with AI",
          values: [
            { text: "Up to 2", sub: "€20 per locale" },
            { text: "Up to 10", sub: "€20 per locale" },
            { text: "Up to 20", sub: "€20 per locale" },
          ],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "A/B testing",
          description: "Run A/B tests with real-time results",
          values: [false, false, { text: "€50", sub: "per 500,000 events" }],
        },
      ],
    },
    {
      category: null,
      items: [
        {
          name: "Custom proxy",
          description: "Allows multiple sites under one domain",
          values: [false, false, "€300"],
        },
      ],
    },
  ];

  const renderValue = (value) => {
    if (typeof value === "boolean") {
      return value ? <CheckIcon /> : <MinusIcon />;
    }
    if (typeof value === "object" && value.text) {
      return (
        <div className="flex flex-col items-center">
          <p className="text-sm">{value.text}</p>
          {value.sub && <p className="text-xs mt-1">{value.sub}</p>}
        </div>
      );
    }
    return <p className="text-sm text-center">{value}</p>;
  };

  return (
    <section className="py-20 relative bg-white overflow-visible">
      <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-visible">
        <div id="comparison-table" className="relative">
          {/* Masque pour cacher le contenu qui scroll derrière le header */}
          <div className="sticky top-0 h-0 z-30 overflow-hidden">
            <div className="h-20 bg-white"></div>
          </div>

          {/* Sticky Header - reste fixe pendant le scroll de la page */}
          <div className="sticky top-20 z-20 pt-0">
            <div className="rounded-t-2xl bg-white border border-[#E5E5E5] border-b">
              <div className="grid grid-cols-4">
                {/* Spacer */}
                <div className="border-r border-[#E5E5E5]"></div>

                {/* Plan Headers */}
                {plans.map((plan, index) => (
                  <div
                    key={index}
                    className={`p-6 ${index < plans.length - 1 ? "border-r border-[#E5E5E5]" : ""}`}
                  >
                    <p className="font-medium text-left mb-1">{plan.name}</p>
                    <p className="text-sm">{plan.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contenu qui scroll - Features */}
          <div className="border-x border-[#E5E5E5]">
            {features.map((section, sectionIndex) => {
              if (section.category) {
                return (
                  <div
                    key={sectionIndex}
                    className="border-b border-[#E5E5E5] p-6"
                  >
                    <h5 className="text-lg font-medium mb-2">
                      {section.category}
                    </h5>
                    <p className="text-sm max-w-2xl">{section.description}</p>
                  </div>
                );
              }

              return section.items.map((item, itemIndex) => (
                <div
                  key={`${sectionIndex}-${itemIndex}`}
                  className="grid grid-cols-4 border-b border-[#E5E5E5]"
                >
                  {/* Feature Name */}
                  <div className="p-6 border-r border-[#E5E5E5]">
                    <p className="font-medium mb-1">{item.name}</p>
                    {item.description && (
                      <p className="text-sm italic">{item.description}</p>
                    )}
                  </div>

                  {/* Feature Values */}
                  {item.values.map((value, valueIndex) => (
                    <div
                      key={valueIndex}
                      className={`p-6 flex items-center justify-center ${valueIndex < item.values.length - 1 ? "border-r border-[#E5E5E5]" : ""}`}
                    >
                      {renderValue(value)}
                    </div>
                  ))}
                </div>
              ));
            })}

            {/* CTA Buttons */}
            <div className="grid grid-cols-4 bg-black rounded-b-2xl border-b border-[#E5E5E5]">
              {/* Spacer */}
              <div className="border-r border-[#E5E5E5]"></div>

              {/* Buttons */}
              <div className="p-6 border-r border-[#E5E5E5]">
                <button className="w-full px-6 py-3 rounded-full bg-[#E5E5E5] text-white text-sm font-medium hover:bg-[#252525] transition-colors">
                  Start with Basic
                </button>
              </div>
              <div className="p-6 border-r border-[#E5E5E5]">
                <button className="w-full px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors">
                  Start with Pro
                </button>
              </div>
              <div className="p-6">
                <button className="w-full px-6 py-3 rounded-full bg-[#E5E5E5] text-white text-sm font-medium hover:bg-[#252525] transition-colors">
                  Start with Scale
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
