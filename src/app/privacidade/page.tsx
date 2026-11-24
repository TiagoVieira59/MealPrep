export const metadata = { title: "Privacidade — MealPrep" };
export default function Page() {
  return (
    <article className="max-w-xl space-y-4 [&_h2]:mt-6 [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-[34px] leading-tight">Privacidade</h1>
      <p className="text-ink2">A MealPrep recolhe o mínimo. Aqui está, em linguagem simples, o que fica onde.</p>
      <h2>No teu dispositivo</h2>
      <ul><li>As medidas corporais (sexo, idade, altura, peso), as respostas do questionário, o registo do que comeste ou saltaste e os itens marcados na lista ficam só no teu telemóvel (localStorage). Não as enviamos para o servidor.</li></ul>
      <h2>No servidor (Supabase, UE)</h2>
      <ul><li>Uma conta anónima criada automaticamente (sem nome nem email, a menos que acrescentes um para usares noutro dispositivo).</li>
        <li>As metas diárias (calorias e proteína), o objetivo, as preferências (dieta, alergénios, exclusões, equipamento, orçamento, supermercado) e as semanas geradas.</li>
        <li>Se usares o agregado: o código partilhado (guardado apenas cifrado, como HMAC), os membros e os itens marcados da lista.</li>
        <li>Mensagens do chat, sugestões, votos e denúncias; candidaturas de criadores (nome, email, país, TikTok, links) e códigos de criador usados.</li>
        <li>Registo de sucesso ou falha de cada Scan the Plate e de tentativas de código durante 30 dias, para limitar abusos.</li></ul>
      <h2>Scan the Plate e a Google (Gemini)</h2>
      <p>Quando tiras uma foto, esta é reduzida no teu dispositivo e enviada para a API Gemini da Google para estimar o prato. Não é guardada por nós e não enviamos o teu nome, email, ID de conta nem do dispositivo. No nível gratuito da Google, os pedidos podem ser usados para melhorar os produtos da Google. O resultado é sempre uma «estimativa da IA»; podes introduzir os valores à mão.</p>
      <h2>Dados nutricionais</h2>
      <p>Os valores vêm da base USDA FoodData Central (SR Legacy), de domínio público (CC0), e são calculados por aritmética no código. Os preços são estimativas aproximadas.</p>
      <h2>Idade mínima</h2><p>A MealPrep destina-se a maiores de 13 anos.</p>
      <h2>Eliminar a conta</h2><p>Em Tu → «Eliminar conta e dados» apagamos a conta e todos os dados associados no servidor. Os dados no dispositivo apagam-se ao limpar os dados do site.</p>
      <h2>Aviso médico</h2><p>A MealPrep é uma ferramenta de planeamento, não aconselhamento médico.</p>
      <h2>Sem anúncios nem analytics</h2><p>Não usamos anúncios, análise de terceiros nem cookies de seguimento.</p>
    </article>
  );
}
