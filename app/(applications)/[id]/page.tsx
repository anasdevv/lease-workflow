export default async function ApplicationStatusPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <div>Status view for {params.id}</div>;
}
