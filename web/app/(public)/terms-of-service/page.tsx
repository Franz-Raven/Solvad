import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms and Conditions | Solvad",
  description:
    "Read the terms for using Solvad, the platform connecting academic talent with industry challenges.",
};

const sections = [
  {
    title: "1. About these terms",
    content: (
      <p>
        These Terms and Conditions govern your access to and use of Solvad, an
        academic-industry platform for posting real-world challenges,
        discovering relevant problems, and collaborating on potential
        solutions. By creating an account or using Solvad, you agree to these
        terms. If you do not agree, do not use the service.
      </p>
    ),
  },
  {
    title: "2. Accounts and eligibility",
    content: (
      <>
        <p>
          You must provide accurate information, use an email address you
          control, and keep your account information current. You are
          responsible for safeguarding your sign-in credentials and for
          activity performed through your account. Notify the platform
          administrators promptly if you believe your account has been
          accessed without permission.
        </p>
        <p>
          Solvad supports different participant roles, including solvers and
          seekers. You agree to use the features and permissions associated
          with your role honestly and only for their intended purposes.
        </p>
      </>
    ),
  },
  {
    title: "3. Acceptable use",
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Post false, misleading, unlawful, or infringing content.</li>
          <li>Upload malware, attempt to disrupt the service, or access accounts or data without authorization.</li>
          <li>Use Solvad to harass, impersonate, spam, or harm another person or organization.</li>
          <li>Submit content that you do not have the right to share, including another party&apos;s confidential or personal information.</li>
          <li>Scrape, copy, or use platform information beyond what is permitted by law or authorized by the relevant rights holder.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Problems, submissions, and collaboration",
    content: (
      <>
        <p>
          Seekers are responsible for ensuring they have authority to publish
          their problem descriptions, documents, and other materials. Solvers
          are responsible for their proposals, work, and other submissions.
          You retain the rights you hold in the content you submit.
        </p>
        <p>
          By submitting content, you give Solvad permission to host, store,
          display, and process it as reasonably necessary to operate the
          platform, provide matching and collaboration features, and make the
          content available to users authorized to access it. This permission
          does not transfer ownership of your content to Solvad.
        </p>
        <p>
          Solvad does not determine ownership, licensing, confidentiality,
          compensation, or other obligations between seekers and solvers for
          work produced through the platform. Participants should agree on
          those matters separately before sharing sensitive information or
          beginning work. Do not treat a platform submission as a confidentiality
          agreement, employment offer, or transfer of intellectual property.
        </p>
      </>
    ),
  },
  {
    title: "5. Matching and automated features",
    content: (
      <p>
        Solvad may use profile details, skills, problem information, and
        automated analysis to support recommendations, search, or comparison.
        These features are informational aids only. Solvad does not guarantee
        that recommendations will be complete or accurate, that a particular
        participant will be selected, or that a project will produce a
        successful, safe, or commercially viable result. Users remain
        responsible for evaluating information and decisions.
      </p>
    ),
  },
  {
    title: "6. Third-party services",
    content: (
      <p>
        Some parts of Solvad may rely on third-party services, such as hosting,
        file storage, or email delivery. Those services may have their own
        terms and privacy practices. Solvad is not responsible for services it
        does not operate, and their availability may affect platform features.
      </p>
    ),
  },
  {
    title: "7. Service availability and account actions",
    content: (
      <p>
        We may update, suspend, or discontinue features as the platform
        develops. We may restrict or suspend access when reasonably necessary
        to protect users, maintain the service, investigate a suspected
        violation, or comply with law. Where practical, we will seek to provide
        notice or an opportunity to address the issue.
      </p>
    ),
  },
  {
    title: "8. Disclaimers",
    content: (
      <p>
        Solvad is provided on an &quot;as available&quot; basis. To the extent
        permitted by law, we do not warrant uninterrupted or error-free
        operation, the accuracy or suitability of user-submitted content, or
        any particular outcome from a project or match. Solvad is a platform
        for discovery and collaboration; it is not a substitute for
        professional, legal, financial, or technical advice.
      </p>
    ),
  },
  {
    title: "9. Limitation of liability",
    content: (
      <p>
        To the extent permitted by applicable law, Solvad and its operators
        will not be liable for indirect, incidental, special, consequential,
        or punitive damages, or for loss of data, profits, opportunities, or
        goodwill arising from your use of the service. Nothing in these terms
        excludes liability that cannot lawfully be excluded.
      </p>
    ),
  },
  {
    title: "10. Changes, governing law, and contact",
    content: (
      <>
        <p>
          We may revise these terms as the platform changes. The date at the
          top of this page indicates when they were most recently updated.
          Continued use after an update means the revised terms apply to your
          future use, subject to applicable law.
        </p>
        <p>
          These terms are governed by the laws of the Philippines, without
          limiting any mandatory protections that apply to you under local law.
          Questions about these terms may be directed to the Solvad platform
          administrators through the support channel made available to you.
        </p>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <article className="mx-auto max-w-4xl">
          <header className="mb-10 border-b border-gray-200 pb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#288760]">
              Solvad
            </p>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              Terms and Conditions
            </h1>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: October 26, 2026
            </p>
            <p className="mt-5 text-base leading-7 text-gray-600">
              Please read these terms before using Solvad to post challenges,
              discover opportunities, or collaborate on solutions.
            </p>
          </header>

          <div className="space-y-8 text-base leading-7 text-gray-700 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {sections.map(({ title, content }) => (
              <section key={title} className="space-y-3">
                <h2 className="text-xl font-semibold leading-7 text-gray-900">
                  {title}
                </h2>
                {content}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}