import { PageHeader } from "@/components/layout/page-header";
import { TreeView } from "./tree-view";

type Props = { params: Promise<{ familyId: string }> };

export default async function FamilyTreePage({ params }: Props) {
  const { familyId } = await params;
  return (
    <div className="space-y-8">
      <PageHeader
        title="شجرة العائلة"
        description="استخدم البحث للانتقال السريع، وانقر على أي فرد لعرض التفاصيل. يمكنك تصدير الشجرة كصورة أو PDF من شريط الأدوات فوق اللوحة."
      />
      <TreeView familyId={familyId} />
    </div>
  );
}
