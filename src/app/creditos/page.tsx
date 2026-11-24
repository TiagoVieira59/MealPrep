import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import photos from "../../../data/photos.json";
export const metadata = { title: "Créditos das fotos — MealPrep" };
export default function Page() {
  return (
    <article className="max-w-xl space-y-4">
      <Link href="/" className="btn btn-ghost !min-h-11 w-fit gap-2 text-sm"><ArrowLeft size={16} />Voltar</Link>
      <h1 className="text-[28px] leading-tight">Créditos das fotos</h1>
      <p className="text-ink2">As fotos dos pratos vêm da Wikimedia Commons, com licenças livres. São fotografias ilustrativas de pratos semelhantes, não dos teus pratos exatos. Foram recortadas e redimensionadas; as licenças CC BY-SA mantêm-se.</p>
      <ul className="space-y-2 text-sm">
        {photos.map((p) => (
          <li key={p.file}><a className="underline" href={p.page} rel="noopener noreferrer">{p.title}</a> — autor: {p.author || "ver página"}; licença {p.lic}</li>
        ))}
      </ul>
    </article>
  );
}
