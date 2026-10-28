import { PageHeader } from "../components/PageHeader";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="border-line bg-panel text-muted rounded-xl border p-10 text-center text-sm">
        Esta sección está planificada para una próxima etapa. El MVP arranca por Creative Analytics.
      </div>
    </>
  );
}
