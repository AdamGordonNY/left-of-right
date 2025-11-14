import { Shield, Lock, Database, AlertCircle, Scale } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: November 14, 2025
          </p>
        </div>

        <div className="space-y-8">
          {/* Core Privacy Principle */}
          <section className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Our Commitment to Your Privacy
                </h2>
                <p className="text-green-800 dark:text-green-200 text-base sm:text-lg">
                  <strong>
                    We do not collect, store, sell, or transfer your personal
                    information.
                  </strong>{" "}
                  Period. Your data belongs to you, and we have no interest in
                  it beyond providing you with the best possible service.
                </p>
              </div>
            </div>
          </section>

          {/* Data Encryption */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Data Security & Encryption
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                All data transmitted between your device and our servers is
                encrypted using industry-standard SSL/TLS protocols. Any data
                stored in our systems is encrypted at rest to ensure maximum
                security.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed mt-3">
                We implement security best practices to protect your information
                from unauthorized access, alteration, disclosure, or
                destruction.
              </p>
            </div>
          </section>

          {/* What We Don't Do */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-foreground">
                What We Don't Collect or Do
              </h2>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
                    ✗
                  </span>
                  <span className="text-muted-foreground">
                    We <strong>do not sell</strong> your data to third parties,
                    advertisers, or anyone else
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
                    ✗
                  </span>
                  <span className="text-muted-foreground">
                    We <strong>do not share</strong> your data with third
                    parties for marketing purposes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
                    ✗
                  </span>
                  <span className="text-muted-foreground">
                    We <strong>do not track</strong> your browsing behavior
                    across other websites
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
                    ✗
                  </span>
                  <span className="text-muted-foreground">
                    We <strong>do not collect</strong> personal information
                    beyond what's necessary to provide the service
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
                    ✗
                  </span>
                  <span className="text-muted-foreground">
                    We <strong>do not use</strong> your data for advertising or
                    profiling
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Authentication */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Authentication Services
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                We use Clerk for authentication services. When you sign up or
                log in, Clerk manages your authentication credentials securely.
                We only receive the minimum information necessary to identify
                you within our application (such as a user ID).
              </p>
              <p className="text-muted-foreground text-base leading-relaxed mt-3">
                Clerk's handling of your authentication data is governed by
                their own privacy policy. We do not have access to your
                passwords or authentication secrets.
              </p>
            </div>
          </section>

          {/* Minimal Data Usage */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Data We Store
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                We only store data that is essential for the service to
                function:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-4">
                <li>
                  Your preferences (e.g., which sources you follow, your
                  favorites)
                </li>
                <li>Content you've explicitly saved or bookmarked</li>
                <li>Basic account information needed to provide the service</li>
              </ul>
              <p className="text-muted-foreground text-base leading-relaxed mt-3">
                This data is used solely to enhance your experience and provide
                the features you've requested.
              </p>
            </div>
          </section>

          {/* Legal Compliance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Legal Compliance
              </h2>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
              <p className="text-amber-900 dark:text-amber-100 text-base leading-relaxed">
                The <strong>only circumstance</strong> under which we would
                disclose your data to third parties is if we are legally
                compelled to do so by a valid court order, subpoena, or other
                legal process. We will resist overly broad or inappropriate
                requests and will notify you of such requests unless prohibited
                by law.
              </p>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Your Rights
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                You have complete control over your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-4">
                <li>
                  <strong>Access:</strong> You can view all data we have about
                  you at any time
                </li>
                <li>
                  <strong>Delete:</strong> You can delete your account and all
                  associated data
                </li>
                <li>
                  <strong>Export:</strong> You can request a copy of your data
                </li>
                <li>
                  <strong>Control:</strong> You decide what information to share
                  and what features to use
                </li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Cookies & Local Storage
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                We use cookies and local storage strictly for essential
                functionality, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-4">
                <li>Keeping you logged in</li>
                <li>Remembering your preferences (e.g., grid vs. list view)</li>
                <li>Ensuring the site functions properly</li>
              </ul>
              <p className="text-muted-foreground text-base leading-relaxed mt-3">
                We do not use tracking cookies or analytics cookies that follow
                you across the web.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              <h2 className="text-2xl font-bold text-foreground">
                Changes to This Policy
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                We may update this privacy policy from time to time. Any changes
                will be posted on this page with an updated "Last updated" date.
                We will never make changes that compromise our core commitment
                to your privacy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-foreground">Questions?</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-base leading-relaxed">
                If you have any questions about this privacy policy or how we
                handle your data, please{" "}
                <Link
                  href="/about"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  contact us
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Bottom Banner */}
          <section className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800 mt-8">
            <p className="text-center text-blue-900 dark:text-blue-100 text-lg font-medium">
              Your privacy matters. We mean what we say.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
