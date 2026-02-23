import Footer7 from "@/src/components/footer7";

export default function MainLayout({ children }) {
  return (
    <div className="overflow-x-clip">
      <main>{children}</main>
      <Footer7 />
    </div>
  );
}
