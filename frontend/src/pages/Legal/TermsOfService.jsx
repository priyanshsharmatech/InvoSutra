import LegalLayout, { Section } from "../../components/layout/LegalLayout";

const TermsOfService = () => {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="October 18, 2026">
      <p>
        Welcome to InvoSutra. These Terms of Service ("Terms") govern your
        access to and use of the InvoSutra application and related services (the
        "Service"). By creating an account or using the Service, you agree to be
        bound by these Terms. If you do not agree, please do not use the Service.
      </p>

      <Section heading="1. The Service">
        <p>
          InvoSutra is an invoicing platform for freelancers and small
          businesses. It lets you create, manage, and send invoices, track their
          payment status, generate AI-assisted content (such as invoices parsed
          from text or receipts and payment-reminder emails), and view insights
          about your invoicing activity.
        </p>
      </Section>

      <Section heading="2. Eligibility & Accounts">
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to use the Service. You are responsible for the accuracy of
          the information you provide, for keeping your password secure, and for
          all activity that occurs under your account. Notify us immediately of
          any unauthorized use.
        </p>
      </Section>

      <Section heading="3. Your Content">
        <p>
          You retain all ownership of the data you enter into InvoSutra,
          including invoices, client details, and business information ("Your
          Content"). You grant us a limited licence to store and process Your
          Content solely to operate and provide the Service to you.
        </p>
        <p>
          You are solely responsible for the accuracy, legality, and tax
          compliance of the invoices and other documents you create. InvoSutra
          is a tool for producing invoices and does not provide accounting, tax,
          or legal advice.
        </p>
      </Section>

      <Section heading="4. AI-Generated Content">
        <p>
          Certain features use third-party artificial-intelligence models (such
          as Google Gemini) to extract data from text or images and to draft
          emails and insights. AI output may be inaccurate or incomplete. You
          must review and verify all AI-generated content before relying on it,
          sending it to a client, or using it for financial or tax purposes.
        </p>
      </Section>

      <Section heading="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>use the Service for any unlawful, fraudulent, or deceptive purpose;</li>
          <li>send spam, or issue invoices you are not authorized to issue;</li>
          <li>
            attempt to gain unauthorized access to the Service, other accounts,
            or our systems;
          </li>
          <li>interfere with or disrupt the integrity or performance of the Service;</li>
          <li>
            upload malicious code or content that infringes the rights of others.
          </li>
        </ul>
      </Section>

      <Section heading="6. Emails Sent Through the Service">
        <p>
          The Service can send invoices and reminder emails to recipients you
          specify. You are responsible for ensuring you have a lawful basis to
          contact those recipients and that your messages comply with applicable
          anti-spam and communications laws.
        </p>
      </Section>

      <Section heading="7. Suspension & Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          your account if you violate these Terms or use the Service in a way
          that may cause harm to us or others. Upon termination, your right to
          use the Service ends, though provisions that by their nature should
          survive will continue to apply.
        </p>
      </Section>

      <Section heading="8. Intellectual Property">
        <p>
          The Service, including its software, design, and branding, is owned by
          InvoSutra and protected by intellectual-property laws. These Terms do
          not grant you any right to our trademarks or logos without our prior
          written consent.
        </p>
      </Section>

      <Section heading="9. Disclaimers">
        <p>
          The Service is provided "as is" and "as available" without warranties
          of any kind, whether express or implied, including fitness for a
          particular purpose and non-infringement. We do not warrant that the
          Service will be uninterrupted, error-free, or that AI output will be
          accurate.
        </p>
      </Section>

      <Section heading="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, InvoSutra will not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, or for any loss of profits, revenue, data, or goodwill arising
          out of or relating to your use of the Service.
        </p>
      </Section>

      <Section heading="11. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material
          changes, we will update the "Last updated" date above and, where
          appropriate, notify you. Your continued use of the Service after the
          changes take effect constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section heading="12. Governing Law">
        <p>
          These Terms are governed by the laws of India, without regard to its
          conflict-of-laws principles. Any disputes will be subject to the
          exclusive jurisdiction of the competent courts in India.
        </p>
      </Section>

      <Section heading="13. Contact Us">
        <p>
          If you have questions about these Terms, contact us at{" "}
          <a href="mailto:support@invosutra.com" className="text-blue-700 hover:underline">
            support@invosutra.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
};

export default TermsOfService;
