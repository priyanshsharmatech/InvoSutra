import LegalLayout, { Section } from "../../components/layout/LegalLayout";

const PrivacyPolicy = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="October 18, 2026">
      <p>
        This Privacy Policy explains how InvoSutra ("we", "us") collects, uses,
        and protects your information when you use our invoicing application (the
        "Service"). We are committed to handling your data responsibly and only
        as needed to provide the Service.
      </p>

      <Section heading="1. Information We Collect">
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Account information:</strong> your name, email address, and a
            securely hashed password. Passwords are never stored in plain text.
          </li>
          <li>
            <strong>Business profile:</strong> optional details such as your
            business name, address, and phone number, used to pre-fill invoices.
          </li>
          <li>
            <strong>Invoice data:</strong> the invoices you create, including
            client names, email addresses, line items, amounts, dates, and
            status.
          </li>
          <li>
            <strong>Content you submit to AI features:</strong> text or receipt
            images you choose to process into invoices.
          </li>
          <li>
            <strong>Technical data:</strong> basic logs needed to operate and
            secure the Service.
          </li>
        </ul>
      </Section>

      <Section heading="2. How We Use Your Information">
        <ul className="list-disc list-inside space-y-1">
          <li>to create, store, and manage your invoices and account;</li>
          <li>to provide AI features such as invoice extraction, reminder drafting, and dashboard insights;</li>
          <li>to send invoices and reminder emails on your instruction;</li>
          <li>to secure the Service, prevent abuse, and comply with legal obligations.</li>
        </ul>
      </Section>

      <Section heading="3. AI Processing">
        <p>
          When you use AI features, the relevant content (for example, the text
          or receipt image you provide, or a summary of your invoice totals) is
          sent to a third-party AI provider, Google Gemini, to generate the
          result. We send only what is needed for the feature and do not use this
          content to train our own models. Your use of these features is also
          subject to Google's applicable terms and privacy practices.
        </p>
      </Section>

      <Section heading="4. Email">
        <p>
          If email sending is enabled, invoices and reminder emails are delivered
          through an email provider on your behalf. The recipient address and
          message content you supply are used solely to deliver that message.
        </p>
      </Section>

      <Section heading="5. How We Store & Protect Data">
        <p>
          Your data is stored in a managed cloud database. We apply reasonable
          technical and organizational measures to protect it, including password
          hashing (bcrypt) and authenticated access via signed tokens. A
          short-lived authentication token is stored in your browser's local
          storage to keep you signed in. No method of transmission or storage is
          100% secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section heading="6. Sharing of Information">
        <p>
          We do not sell your personal information. We share data only with
          service providers that help us operate the Service — such as our cloud
          database host, email provider, and the AI provider described above —
          and only to the extent necessary, or when required by law.
        </p>
      </Section>

      <Section heading="7. Your Rights">
        <p>
          You can access and update your account and business information at any
          time from your profile. You may edit or delete your invoices, and you
          may request deletion of your account by contacting us. Note that an
          administrator may deactivate accounts that violate our Terms.
        </p>
      </Section>

      <Section heading="8. Data Retention">
        <p>
          We retain your information for as long as your account is active or as
          needed to provide the Service. We may retain certain information where
          required to comply with legal, tax, or accounting obligations, or to
          resolve disputes.
        </p>
      </Section>

      <Section heading="9. Children's Privacy">
        <p>
          The Service is not directed to individuals under the age of 18, and we
          do not knowingly collect personal information from children.
        </p>
      </Section>

      <Section heading="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be reflected by updating the "Last updated" date above and, where
          appropriate, by notifying you.
        </p>
      </Section>

      <Section heading="11. Contact Us">
        <p>
          For privacy questions or requests, contact us at{" "}
          <a href="mailto:privacy@invosutra.com" className="text-blue-700 hover:underline">
            privacy@invosutra.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
