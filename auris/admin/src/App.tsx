import { useState } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { Topbar } from "./components/Topbar.tsx";
import { SECTION_TITLES, type SectionId } from "./mockData.ts";
import { InicioSection } from "./sections/InicioSection.tsx";
import { EstudiantesSection } from "./sections/EstudiantesSection.tsx";
import { AgentesSection } from "./sections/AgentesSection.tsx";
import { CanalesSection } from "./sections/CanalesSection.tsx";
import { AnaliticaSection } from "./sections/AnaliticaSection.tsx";
import { AjustesSection } from "./sections/AjustesSection.tsx";

// Dashboard shell. Holds only the active-section state; every section owns its
// own data/logic. Conditional render (not display:none) so AjustesSection
// mounts on demand and its GET /settings fires when opened.
export default function App() {
  const [section, setSection] = useState<SectionId>("inicio");

  return (
    <div className="shell">
      <Sidebar active={section} onSelect={setSection} />
      <div className="shell-body">
        <Topbar title={SECTION_TITLES[section]} />
        {section === "inicio" && <InicioSection />}
        {section === "estudiantes" && <EstudiantesSection />}
        {section === "agentes" && <AgentesSection />}
        {section === "canales" && <CanalesSection />}
        {section === "analitica" && <AnaliticaSection />}
        {section === "ajustes" && (
          <div className="shell-main shell-main-ajustes">
            <AjustesSection />
          </div>
        )}
      </div>
    </div>
  );
}
