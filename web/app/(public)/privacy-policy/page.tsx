import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Solvad",
  description:
    "Learn how Solvad collects, uses, and protects information on its academic-industry problem-solving platform.",
};

const sections = [
  {
    title: "Information we collect",
    content: (
      <>
        <p>
          The information we collect depends on how you use Solvad and the role
          you choose. It may include:
        </p>
        <ul>
          <li>
            <strong>Account and profile information:</strong> email address,
            password, account role, name, profile picture, institution or
            organization, degree program, skills, and interests.
          </li>
          <li>
            <strong>Seeker and organization information:</strong> organization
            name, contact person, and contact number.
          </li>
          <li>
            <strong>Project information:</strong> problem titles and
            descriptions, background, objectives, constraints, tags, preferred
            programs, attachments, proposals, subtasks, submitted work, and
            related collaboration or status updates.
          </li>
          <li>
            <strong>Service and device information:</strong> authentication
            tokens and cookies needed to keep you signed in, plus technical
            information sent by your browser or device when it communicates
            with the service.
          </li>
          <li>
            <strong>Messages to us:</strong> information you provide when you
            contact platform administrators or request support.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How we use information",
    content: (
      <>
        <p>We use information as needed to:</p>
        <ul>
          <li>Create and administer accounts, verify email addresses, and authenticate users.</li>
          <li>Operate profiles, problem listings, submissions, workspaces, and collaboration features.</li>
          <li>Recommend or match problems and solvers based on information such as academic program and skills.</li>
          <li>Display, organize, and analyze problem information to support platform features, including automated or AI-assisted insights.</li>
          <li>Send account, verification, service, and support communications.</li>
          <li>Protect the service, investigate misuse, maintain records, and meet applicable legal obligations.</li>
        </ul>
        <p>
          Automated recommendations and analysis are intended to assist
          discovery and comparison. They do not guarantee a match, validate the
          accuracy of submitted information, or replace a person&apos;s
          professional judgment.
        </p>
      </>
    ),
  },
  {
    title: "What other users may see",
    content: (
      <p>
        Information you add to a problem, profile, proposal, or shared
        workspace may be visible to users who can access that feature,
        including relevant solvers, seekers, collaborators, or administrators.
        Do not include personal information about someone else or confidential
        business, academic, or technical information unless you are authorized
        to share it and understand who may see it.
      </p>
    ),
  },
  {
    title: "Cookies and local storage",
    content: (
      <p>
        Solvad uses browser storage and cookies to support sign-in and
        role-based navigation. You can manage or clear these through your
        browser settings, but doing so may sign you out or affect features that
        require an authenticated session.
      </p>
    ),
  },
  {
    title: "When information is shared",
    content: (
      <>
        <p>
          We may make information available to other users as described above
          and to service providers that help operate Solvad, such as providers
          of hosting, file storage, or email delivery. Those providers should
          receive only the information needed for their services and may
          process it in locations outside your own.
        </p>
        <p>
          We may also disclose information when reasonably necessary to
          protect users or the service, respond to lawful requests, enforce
          platform rules, or comply with applicable law. We do not sell
          personal information.
        </p>
      </>
    ),
  },
  {
    title: "Retention and security",
    content: (
      <p>
        We keep information for as long as needed to provide and maintain the
        service, support legitimate platform purposes, resolve disputes, and
        meet legal obligations. We use reasonable measures intended to protect
        information, but no online service or method of storage can be
        guaranteed completely secure.
      </p>
    ),
  },
  {
    title: "Your choices and privacy rights",
    content: (
      <p>
        You can review and update certain profile information through your
        account. Depending on applicable law, you may also have rights to
        request access to, correction of, or deletion of your personal
        information, or to object to or restrict certain processing. To make a
        request, contact the Solvad platform administrators using the support
        channel made available to you. We may need to verify your identity
        before responding.
      </p>
    ),
  },
  {
    title: "Children",
    content: (
      <p>
        Solvad is intended for university-level participants and organizations,
        not children. If you believe a child has provided personal information
        to the service, contact the platform administrators so they can review
        the matter.
      </p>
    ),
  },
  {
    title: "Changes and contact",
    content: (
      <>
        <p>
          We may update this policy as Solvad changes. The date at the top of
          this page indicates when it was most recently revised. Continued use
          after an update means the updated policy applies to your future use,
          subject to applicable law.
        </p>
        <p>
          Questions or privacy requests can be directed to the Solvad platform
          administrators through the support channel made available to you.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: October 26, 2026
            </p>
            <p className="mt-5 text-base leading-7 text-gray-600">
              This policy explains how Solvad handles information when you use
              our platform to connect academic talent with industry challenges.
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