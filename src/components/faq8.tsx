import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const faqs = {
  general: [
    {
      question: "What is a FAQ and why is it important?",
      answer:
        "FAQ stands for Frequently Asked Questions. It is a list that provides answers to common questions people may have about a specific product, service, or topic.",
    },
    {
      question: "Why should I use a FAQ on my website or app?",
      answer:
        "Utilizing a FAQ section on your website or app is a practical way to offer instant assistance to your users or customers. Instead of waiting for customer support responses, they can find quick answers to commonly asked questions. ",
    },
    {
      question: "How do I effectively create a FAQ section?",
      answer:
        "Creating a FAQ section starts with gathering the most frequent questions you receive from your users or customers. Once you have a list, you need to write clear, detailed, and helpful answers to each question.",
    },
    {
      question:
        "What are the benefits of having a well-maintained FAQ section?",
      answer:
        "There are numerous advantages to maintaining a robust FAQ section. Firstly, it provides immediate answers to common queries, which improves the user experience.",
    },
    {
      question: "How do I effectively create a FAQ section?",
      answer:
        "Creating a FAQ section starts with gathering the most frequent questions you receive from your users or customers. Once you have a list, you need to write clear, detailed, and helpful answers to each question.",
    },
  ],
  billing: [
    {
      question: "How do I change my billing information?",
      answer:
        "You can change your billing information by logging into your account and navigating to the billing section.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel your subscription by logging into your account and navigating to the billing section.",
    },
    {
      question: "What is the refund policy?",
      answer:
        "We offer a 30-day refund policy. If you are not satisfied with our product, you can request a refund within 30 days of purchase.",
    },
    {
      question: "How do I update my payment method?",
      answer:
        "You can update your payment method by logging into your account and navigating to the billing section.",
    },
  ],
};

interface Faq8Props {
  className?: string;
}

const Faq8 = ({ className }: Faq8Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <h2 className="mb-8 text-3xl font-semibold md:mb-11 md:text-5xl">
          Frequently asked questions.
        </h2>
        <div className="grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10">
          <h3 className="text-xl font-medium">General</h3>
          <Accordion type="multiple" className="md:col-span-2">
            {faqs.general.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-10 grid gap-4 border-t pt-4 md:grid-cols-3 md:gap-10">
          <h3 className="text-xl font-medium">Billing</h3>
          <Accordion type="multiple" className="md:col-span-2">
            {faqs.billing.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export { Faq8 };
