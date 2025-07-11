import React from "react";
import Image from "next/image";

const TestimonialsSection = () => {
  const testimonials = [
    // Column 1
    [
      {
        text: "What a fantastic AI Proactiv AI is, I just love it. It has completely transformed the way I approach problems and develop solutions.",
        author: "Manu Arora",
        role: "Tech Innovator & Entrepreneur",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
      {
        text: "I made a soap with the help of AI, it was so easy to use.",
        author: "Tyler Durden",
        role: "Creative Director & Business Owner",
        avatar: "https://i.pravatar.cc/150?img=2",
      },
      {
        text: "This AI has transformed the way I work! It's like having a brilliant assistant who knows exactly what I need before I even ask.",
        author: "Alice Johnson",
        role: "Senior Software Engineer",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
    ],
    // Column 2
    [
      {
        text: "Absolutely revolutionary, a game-changer for our industry.",
        author: "Bob Smith",
        role: "Industry Analyst",
        avatar: "https://i.pravatar.cc/150?img=4",
      },
      {
        text: "I can't imagine going back to how things were before this AI.",
        author: "Cathy Lee",
        role: "Product Manager",
        avatar: "https://i.pravatar.cc/150?img=5",
      },
      {
        text: "It's like having a superpower! This AI tool has given us the ability to do things we never thought were possible in our field.",
        author: "David Wright",
        role: "Research Scientist",
        avatar: "https://i.pravatar.cc/150?img=6",
      },
    ],
    // Column 3
    [
      {
        text: "The efficiency it brings is unmatched. It's a vital tool that has helped us cut costs and improve our end product significantly.",
        author: "Eva Green",
        role: "Operations Director",
        avatar: "https://i.pravatar.cc/150?img=7",
      },
      {
        text: "A robust solution that fits perfectly into our workflow. It has enhanced our team's capabilities and allowed us to tackle more complex projects.",
        author: "Frank Moore",
        role: "Project Manager",
        avatar: "https://i.pravatar.cc/150?img=8",
      },
      {
        text: "It's incredibly intuitive and easy to use. Even those without technical expertise can leverage its power to improve their workflows.",
        author: "Grace Hall",
        role: "Marketing Specialist",
        avatar: "https://i.pravatar.cc/150?img=9",
      },
    ],
    // Column 4
    [
      {
        text: "It has saved us countless hours. Highly recommended for anyone looking to enhance their efficiency and productivity.",
        author: "Henry Ford",
        role: "Operations Analyst",
        avatar: "https://i.pravatar.cc/150?img=10",
      },
      {
        text: "A must-have tool for any professional. It's revolutionized the way we approach problem-solving and decision-making.",
        author: "Ivy Wilson",
        role: "Business Consultant",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
      {
        text: "The results are always impressive. This AI has helped us to not only meet but exceed our performance targets.",
        author: "Jack Brown",
        role: "Performance Manager",
        avatar: "https://i.pravatar.cc/150?img=12",
      },
    ],
  ];

  const QuoteIcon = () => (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      className="absolute top-2 left-2 text-neutral-300"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"></path>
    </svg>
  );

  const TestimonialCard = ({ testimonial }) => (
    <div className="p-8 rounded-xl border relative bg-white dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.30)] shadow-xs group">
      <QuoteIcon />
      <h3 className="text-base font-normal dark:text-white text-black py-2 relative">
        {testimonial.text}
      </h3>
      <div className="flex gap-2 items-center mt-8">
        <Image
          alt={testimonial.author}
          loading="lazy"
          width={40}
          height={40}
          className="rounded-full"
          src={testimonial.avatar}
        />
        <div className="flex flex-col">
          <p className="text-xs font-normal dark:text-neutral-400 text-neutral-600 max-w-sm">
            {testimonial.author}
          </p>
          <p className="font-normal dark:text-neutral-400 text-neutral-600 max-w-sm text-[10px]">
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-medium text-gray-900 mb-4">
            Vos retours font notre force
          </h2>
          <p className="text-md text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Découvrez comment nos utilisateurs transforment leur quotidien grâce
            à notre solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {testimonials.map((column, columnIndex) => (
            <div key={columnIndex} className="grid gap-4 items-start">
              {column.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
