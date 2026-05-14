import "./globals.css";

export const metadata = {
  title: "Brainly Helper",
  description: "Busque a melhor resposta no Brainly para suas questões.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
