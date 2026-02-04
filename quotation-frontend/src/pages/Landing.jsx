import { Link } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import { useI18n } from "../i18n/i18n";

function StepCard({ step, title, children }) {
  return (
    <div className="card-surface rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
          {step}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
        </div>
      </div>
    </div>
  );
}

function Tip({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen w-screen bg-slate-100">
      <div className="flex min-h-screen flex-col px-5 py-8 md:px-8 lg:px-10 2xl:px-12">
        <div className="sticky top-0 z-40 -mx-5 bg-slate-100/90 px-5 pb-4 pt-4 backdrop-blur supports-[backdrop-filter]:bg-slate-100/75 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 2xl:-mx-12 2xl:px-12">
          <header className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <img
                  src="/images/logo-q.png"
                  alt={t("auth.loginTitle")}
                  className="h-full w-full object-contain p-0 scale-175 origin-center drop-shadow-sm"
                  loading="eager"
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {t("auth.loginTitle")}
                </div>
                <div className="truncate text-[11px] text-slate-500 sm:text-xs">
                  {t("landing.tagline")}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4 sm:text-sm"
              >
                {t("common.login")}
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4 sm:text-sm"
              >
                {t("common.registerTechnician")}
              </Link>
            </div>
          </header>
          <div className="mt-3 sm:hidden">
            <LanguageToggle compact />
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-700 to-slate-900 px-7 py-8 text-white shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              {t("landing.quickGuide")}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85">
              {t("landing.heroBody")}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-xs font-semibold text-white/70">
                  {t("landing.requiredLabel")}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {t("landing.requiredValue")}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="text-xs font-semibold text-white/70">
                  {t("landing.bestPracticeLabel")}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {t("landing.bestPracticeValue")}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <StepCard step="1" title={t("landing.step1Title")}>
              {t("landing.step1Body")}
            </StepCard>
            <StepCard step="2" title={t("landing.step2Title")}>
              {t("landing.step2Body")}
            </StepCard>
            <StepCard step="3" title={t("landing.step3Title")}>
              {t("landing.step3Body")}
            </StepCard>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("landing.tipsTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("landing.tipsSubtitle")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Tip title={t("landing.tipAutocompleteTitle")}>
              {t("landing.tipAutocompleteBody")}
            </Tip>
            <Tip title={t("landing.tipSizeTitle")}>{t("landing.tipSizeBody")}</Tip>
            <Tip title={t("landing.tipUnitTitle")}>{t("landing.tipUnitBody")}</Tip>
            <Tip title={t("landing.tipExtraWordsTitle")}>
              {t("landing.tipExtraWordsBody")}
            </Tip>
            <Tip title={t("landing.tipReviewTitle")}>{t("landing.tipReviewBody")}</Tip>
            <Tip title={t("landing.tipSearchTitle")}>{t("landing.tipSearchBody")}</Tip>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card-surface rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              {t("landing.zonesTitle")}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.zonesValue")}
            </p>
          </div>
          <div className="card-surface rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-900">{t("landing.nextTitle")}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {t("landing.nextBody")}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/login"
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                {t("landing.goToLogin")}
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {t("common.registerTechnician")}
              </Link>
            </div>
          </div>
        </section>

        <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div>Developer: Mohamed Said Shango</div>
            <div>Location: UDOM, Dodoma</div>
            <div className="max-w-full break-words">
              Phone: 0615082570 / 0750690012 · Email: mosatgentlemedy@gmail.com /
              montanafrenv@gmail.com
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
