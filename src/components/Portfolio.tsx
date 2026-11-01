"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { content, skillGroups, type Locale } from "@/content";
import type { CmsRecord } from "@/lib/supabase/content";

function AmbientField() {
  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("#ambient");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = matchMedia("(max-width: 700px)").matches;
    const amount = reduce ? 20 : small ? 34 : 64;
    let width = 0, height = 0, frame = 0;
    const points = Array.from({ length: amount }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00025, vy: (Math.random() - .5) * .00025, r: 0.7 + Math.random() * 1.2 }));
    const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); width = canvas.clientWidth; height = canvas.clientHeight; canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      points.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j], dx = (p.x - q.x) * width, dy = (p.y - q.y) * height, dist = Math.hypot(dx, dy);
          if (dist < 130) { ctx.strokeStyle = `rgba(52, 211, 153, ${.1 * (1 - dist / 130)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x * width, p.y * height); ctx.lineTo(q.x * width, q.y * height); ctx.stroke(); }
        }
        ctx.fillStyle = i % 4 === 0 ? "rgba(79, 209, 255, .56)" : "rgba(126, 231, 162, .45)"; ctx.beginPath(); ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2); ctx.fill();
      });
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    resize(); draw(); addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); removeEventListener("resize", resize); };
  }, []);
  return <canvas id="ambient" aria-hidden="true" />;
}

const asText = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const asList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const makeSlug = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
function skillCategory(skill: string, locale: Locale) {
  const value = skill.toLowerCase();
  if (/cctv|nvr|ivms|surveillance|ip camera|kamera/.test(value)) return locale === "id" ? "CCTV & Monitoring" : "CCTV & Monitoring";
  if (/jaringan|network|\blan\b|dhcp|\bdns\b|tcp\/?ip|router|switch|subnet|vlan|mikrotik|wi-?fi|ethernet|firewall|routing|wireless/.test(value)) return locale === "id" ? "Jaringan" : "Networking";
  if (/mysql|postgres|\bsql\b|database|basis data|mongodb|supabase/.test(value)) return locale === "id" ? "Database" : "Databases";
  if (/figma|ui\/?ux|user interface|wireframe|prototyp|graphic design|desain visual/.test(value)) return locale === "id" ? "Desain & Prototyping" : "Design & Prototyping";
  if (/tegangan|voltage|hardware|sensor|embedded|\biot\b|bms|\bplc\b|pcb|enclosure|casing|\b3d\b|komponen|microcontroller|arduino|esp32/.test(value)) return locale === "id" ? "Hardware, Elektronika & Embedded" : "Hardware, Electronics & Embedded";
  if (/bcrypt|authenticat|autentikasi|cyber|security|wireshark|siem|blue team|event viewer|nmap/.test(value)) return locale === "id" ? "Keamanan & Autentikasi" : "Security & Authentication";
  if (/linux|zorin|ubuntu|windows|macos|operating system|sistem operasi|docker|server|vmware|proxmox/.test(value)) return locale === "id" ? "Sistem Operasi & Infrastruktur" : "Operating Systems & Infrastructure";
  if (/php|react|tailwind|node\.?js|express|javascript|typescript|python|java\b|\bc\+\+?\b|program|software|web|rest(?:ful)?\s*api|\bapi\b|flutter|next\.?js/.test(value)) return locale === "id" ? "Pemrograman & Web" : "Programming & Web";
  return locale === "id" ? "Teknologi Lainnya" : "Other Technologies";
}

export default function Portfolio({ locale, entries = [] }: { locale: Locale; entries?: CmsRecord[] }) {
  const t = content[locale];
  const cmsExperiences = entries.filter(row => row.kind === "experience");
  const displayExperience = cmsExperiences.map(row => ({ company: row.title, role: asText(row.payload.role, row.title), period: asText(row.payload.period, "—"), project: asText(row.payload.project, "—"), stack: asList(row.payload.stack).join(" · "), bullets: asList(row.payload.bullets) }));
  const cmsProjects = entries.filter(row => row.kind === "project");
  const stackSkills = [...cmsProjects.flatMap(row => asList(row.payload.technologies)), ...cmsExperiences.flatMap(row => asList(row.payload.stack))]
    .reduce<string[]>((items, skill) => items.some(item => item.toLowerCase() === skill.trim().toLowerCase()) || !skill.trim() ? items : [...items, skill.trim()], []);
  const cmsSkills = entries.filter(row => row.kind === "skill");
  const groupedStackSkills = stackSkills.reduce<{ id: string; name: string; level: string; items: string[] }[]>((groups, skill) => {
    const name = skillCategory(skill, locale);
    const existing = groups.find(group => group.name === name);
    if (existing) existing.items.push(skill);
    else groups.push({ id: makeSlug(name), name, level: "practiced", items: [skill] });
    return groups;
  }, []);
  const displaySkills = stackSkills.length
    ? groupedStackSkills
    : [...cmsSkills.map(row => ({ id: row.id, name: row.title, level: asText(row.payload.level, "practiced"), items: asList(row.payload.items) })), ...skillGroups.filter(group => !cmsSkills.some(cms => cms.title.toLowerCase() === group.name[locale].toLowerCase())).map(group => ({ id: group.id, name: group.name[locale], level: group.level, items: [...group.items] }))];
  const displayProjects = cmsProjects.map(row => ({ id: row.id, slug: asText(row.payload.slug, makeSlug(row.title)), title: row.title, subtitle: asText(row.payload.subtitle), category: asText(row.payload.category, "Project"), description: asText(row.payload.description), status: asText(row.payload.status, t.open), thumbnail: asText(row.payload.thumbnailUrl), tags: asList(row.payload.technologies).length ? asList(row.payload.technologies) : asList(row.payload.tags) }));
  const education = entries.find(row => row.kind === "education");
  const [roleIndex, setRoleIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const filteredProjects = selectedSkill
    ? displayProjects.filter(project => project.tags.some(tag => tag.toLowerCase().includes(selectedSkill.toLowerCase()) || selectedSkill.toLowerCase().includes(tag.toLowerCase())))
    : displayProjects;
  const filterBySkill = (skill: string) => {
    setSelectedSkill(current => current === skill ? "" : skill);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.getElementById("projects")?.scrollIntoView();
    else document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setRoleIndex(i => (i + 1) % t.roles.length), 3200);
    return () => clearInterval(timer);
  }, [t.roles.length]);
  useEffect(() => {
    document.documentElement.lang = locale;
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [locale]);
  useEffect(() => {
    const finePointer = matchMedia("(pointer: fine)").matches;
    if (!finePointer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glow = document.querySelector<HTMLElement>(".cursor-glow");
    const move = (event: PointerEvent) => {
      if (glow) { glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`; }
      const target = (event.target as HTMLElement).closest<HTMLElement>(".button");
      document.querySelectorAll<HTMLElement>(".button.magnetic").forEach(button => { if (button !== target) { button.style.removeProperty("--mx"); button.style.removeProperty("--my"); } });
      if (target) {
        target.classList.add("magnetic");
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${(event.clientX - rect.left - rect.width / 2) * .07}px`);
        target.style.setProperty("--my", `${(event.clientY - rect.top - rect.height / 2) * .11}px`);
      }
    };
    const reset = () => document.querySelectorAll<HTMLElement>(".button.magnetic").forEach(button => { button.style.removeProperty("--mx"); button.style.removeProperty("--my"); });
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerleave", reset);
    return () => { removeEventListener("pointermove", move); removeEventListener("pointerleave", reset); };
  }, []);
  return <>
    <AmbientField />
    <div className="cursor-glow" aria-hidden="true" />
    <header className="topbar">
      <a className="brand" href="#home" aria-label="by.vania home"><span className="brand-mark">&lt;/&gt;</span> by.vania<span className="brand-dot">_</span></a>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}><span /><span /></button>
      <nav className={menuOpen ? "nav open" : "nav"} aria-label={locale === "id" ? "Navigasi utama" : "Main navigation"}>
        {t.nav.filter((_, i) => i !== 4).map((label, i) => <a key={label} href={`#${["profile", "experience", "skills", "projects", "contact"][i]}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <div className="language"><a className={locale === "id" ? "active" : ""} href="/id" lang="id" aria-label="Bahasa Indonesia">ID</a><span>/</span><a className={locale === "en" ? "active" : ""} href="/en" lang="en" aria-label="English">EN</a></div>
      </nav>
    </header>
    <main>
      <section className="hero section-wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" />{locale === "id" ? "PORTOFOLIO · TEKNIK KOMPUTER" : "PORTFOLIO · COMPUTER ENGINEERING"}</div>
          <div className="terminal-label">$ whoami</div>
          <p className="hero-lead">{t.heroLead}</p>
          <h1>Vania Bunga<br /><span>Febrina</span><i className="underscore">_</i></h1>
          <div className="role-line"><span className="role-prefix">$ current_role</span><span className="role-value" key={roleIndex}>{t.roles[roleIndex]}</span></div>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions"><a className="button primary" href="#contact">{t.contact}</a><a className="button secondary" href="#projects">{t.work}</a></div>
          <div className="availability"><span />{t.location}</div>
        </div>
        <div className="hero-aside" aria-label="Terminal profile preview">
          <div className="hero-portrait" aria-label={locale === "id" ? "Foto Vania" : "Portrait of Vania"}><div className="hero-portrait-frame"><Image src="/images/vania-profile.png" alt={locale === "id" ? "Vania Bunga Febrina mengenakan kebaya dan medali" : "Vania Bunga Febrina wearing traditional attire and a medal"} width={1280} height={1920} priority unoptimized /></div><span className="hero-portrait-label">IDENTITY / 01</span></div>
          <div className="terminal-window">
            <div className="terminal-top"><div className="window-dots"><i /><i /><i /></div><span>vania@workspace:~</span><span className="terminal-lock">● SECURE SESSION</span></div>
            <div className="terminal-body"><div className="line-number">01<br />02<br />03<br />04<br />05<br />06<br />07<br />08<br />09<br />10</div><div className="terminal-code"><p><b>$</b> cat profile.json</p><p className="code-muted">{`{`}</p><p><span className="code-key">  "name"</span>: <span className="code-green">"Vania Bunga Febrina"</span>,</p><p><span className="code-key">  "degree"</span>: <span className="code-green">"Computer Engineering"</span>,</p><p><span className="code-key">  "focus"</span>: [</p><p className="code-green">    "Software Development",</p><p className="code-green">    "Hardware",</p><p className="code-green">    "Networking",</p><p className="code-green">    "IT Infrastructure"</p><p>  ]</p><p className="code-muted">{`}`}</p><p className="terminal-ready"><span className="status-dot" /> {locale === "id" ? "SISTEM SIAP" : "SYSTEM READY"}<span className="blinking-cursor">▋</span></p></div></div>
            <div className="terminal-foot"><span>root@byvania:~#</span><span>UTF-8 · {locale.toUpperCase()}</span></div>
          </div>
          <div className="hero-index">01 <span>/</span> 06</div>
        </div>
        <a href="#profile" className="scroll-cue"><span />SCROLL TO EXPLORE</a>
      </section>

      <section className="content-section section-wrap" id="profile">
        <div className="section-heading reveal"><div><span className="command">$ system --profile</span><h2>{t.profileTitle}<span>.</span></h2></div><span className="section-id">01 / PROFILE</span></div>
        <div className="profile-grid reveal">
          <div className="portrait-card"><div className="portrait-grid" /><div className="portrait-frame"><div className="portrait-placeholder portrait-photo-wrap"><img className="portrait-image" src="/images/vania-profile.jpg" alt={locale === "id" ? "Vania Bunga Febrina di depan gedung kampus" : "Vania Bunga Febrina in front of a campus building"} loading="lazy" decoding="async" /><span className="portrait-caption">VANIA BUNGA FEBRINA</span></div><span className="frame-corner tl"/><span className="frame-corner tr"/><span className="frame-corner bl"/><span className="frame-corner br"/></div><div className="portrait-tag"><span className="status-dot" /> VANIA.BF <span>· COMPUTER ENGINEERING</span></div><span className="portrait-coordinate">08° 39′ S<br />115° 13′ E</span></div>
          <div className="profile-copy"><div className="profile-meta"><span>SYS.PROFILE / 001</span><span>STATUS: ACTIVE</span></div><h3>{t.degree}</h3><p>{t.profile}</p><div className="profile-facts"><div><span>01</span><div><small>{locale === "id" ? "BIDANG" : "BACKGROUND"}</small><strong>{locale === "id" ? "Teknik Komputer" : "Computer Engineering"}</strong></div></div><div><span>02</span><div><small>{locale === "id" ? "MINAT" : "INTERESTS"}</small><strong>Development · Infrastructure · Security</strong></div></div><div><span>03</span><div><small>{locale === "id" ? "PENDEKATAN" : "APPROACH"}</small><strong>{locale === "id" ? "Praktis · Terdokumentasi · Kolaboratif" : "Practical · Documented · Collaborative"}</strong></div></div></div></div>
        </div>
      </section>

      <section className="content-section section-wrap" id="experience">
        <div className="section-heading reveal"><div><span className="command">$ ls ./experience</span><h2>{t.experience}<span>.</span></h2></div><span className="section-id">02 / HISTORY</span></div>
        <div className="timeline">{displayExperience.map((item, i) => <article className="experience-card reveal" key={item.company}><div className="timeline-marker"><span>0{i + 1}</span><i /></div><div className="experience-main"><div className="experience-head"><div><span className="company-type">{locale === "id" ? "PENGALAMAN" : "EXPERIENCE"}</span><h3>{item.company}</h3></div><span className="period">{item.period}</span></div><div className="experience-meta"><span><small>{t.role}</small>{item.role}</span><span><small>{t.project}</small>{item.project}</span></div><ul>{item.bullets.map(b => <li key={b}>{b}</li>)}</ul><div className="tag-row">{item.stack.split(" · ").filter(Boolean).map(tag => <span key={tag}>{tag}</span>)}</div></div></article>)}</div>
      </section>

      <section className="content-section skills-section section-wrap" id="skills">
        <div className="section-heading reveal"><div><span className="command">$ cat ./skills.json</span><h2>{t.skills}<span>.</span></h2></div><span className="section-id">03 / TOOLKIT</span></div>
        <div className="skill-legend reveal"><span><i className="legend-dot practiced" />{t.practiced}</span><span><i className="legend-dot learning" />{t.learning}</span></div>
        <div className="skills-grid">{displaySkills.map((group, i) => <article className={`skill-card reveal ${group.level}`} key={group.id}><div className="skill-card-head"><span className="skill-index">0{i + 1}</span><span className="skill-level">{group.level === "learning" ? t.learning : t.practiced}</span></div><h3>{group.name}</h3><div className="skill-tags">{group.items.map(item => <button type="button" className={`skill-filter-tag ${selectedSkill === item ? "active" : ""}`} key={item} aria-pressed={selectedSkill === item} onClick={() => filterBySkill(item)} title={locale === "id" ? `Lihat proyek dengan skill ${item}` : `Show projects using ${item}`}>{item}</button>)}</div><div className="skill-card-foot"><span>SKILLSET / {group.name.toUpperCase()}</span><span>↗</span></div></article>)}</div>
      </section>

      <section className="content-section projects-section section-wrap" id="projects">
        <div className="section-heading reveal"><div><span className="command">$ ./projects --list</span><h2>{t.projects}<span>.</span></h2></div><span className="section-id">04 / BUILDS</span></div>
        <div className="project-notice project-stage-note"><span>i</span><p>{t.projectStageNote}</p></div>
        {selectedSkill && <div className="project-notice reveal"><span>i</span><p>{locale === "id" ? `Menampilkan proyek yang menggunakan “${selectedSkill}”.` : `Showing projects using “${selectedSkill}”.`}</p><button type="button" className="clear-skill-filter" onClick={() => setSelectedSkill("")}>{locale === "id" ? "Hapus filter" : "Clear filter"} ×</button></div>}
        {filteredProjects.length ? <div className="projects-grid">{filteredProjects.map((item, i) => <Link className="project-card reveal" href={`/${locale}/projects/${item.slug}`} key={item.id}><div className="project-visual visual-cms"><div className="visual-top"><span>PROJECT / 0{i + 1}</span><span>↗</span></div><div className="visual-art" aria-hidden="true">{item.thumbnail ? <img className="project-thumbnail" src={item.thumbnail} alt="" loading="lazy" decoding="async" /> : <div className="project-art-placeholder"><span>&lt;/&gt;</span><i/><i/><b>PROJECT FILE</b></div>}</div><span className="visual-class">{item.category}</span></div><div className="project-body"><div className="project-status"><i />{item.status}</div><h3>{item.title}</h3>{item.subtitle && <p className="project-subtitle">{item.subtitle}</p>}<p>{item.description}</p><div className="tag-row">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="project-detail"><span>{t.details}</span><span>CASE FILE · {item.slug.toUpperCase()}</span></div></div></Link>)}</div> : selectedSkill ? <p className="skill-empty-state">{locale === "id" ? `Belum ada proyek dengan tag “${selectedSkill}”.` : `No projects tagged “${selectedSkill}” yet.`}</p> : null}
      </section>

      <section hidden className="content-section education-section section-wrap" id="education">
        <div className="section-heading reveal"><div><span className="command">$ cat ./education.txt</span><h2>{t.education}<span>.</span></h2></div><span className="section-id">05 / FOUNDATION</span></div>
        <div className="education-panel reveal"><div className="education-icon">∑</div><div className="education-info"><span className="company-type">{locale === "id" ? "LATAR AKADEMIK" : "ACADEMIC BACKGROUND"}</span><h3>{education?.title || t.degree}</h3><p>{education ? asText(education.payload.description, t.educationNote) : t.educationNote}</p></div><div className="education-pending"><span className="status-dot" />{education ? (locale === "id" ? "TERBIT" : "PUBLISHED") : t.educationStatus}</div><span className="edu-watermark">B.Eng</span></div>
      </section>

      <section className="contact-section section-wrap" id="contact">
        <div className="contact-panel reveal">
          <div className="contact-top"><span className="command">$ ./contact --connect</span><span className="section-id">06 / CONNECTION</span></div>
          <div className="contact-content">
            <div className="contact-copy"><h2>{t.contactTitle}<span>.</span></h2><p>{t.contactIntro}</p><div className="contact-console"><span className="status-dot" />{locale === "id" ? "TERBUKA UNTUK PELUANG" : "OPEN TO OPPORTUNITIES"}</div></div>
            <div className="contact-links">
              <a className="contact-link" href="https://mail.google.com/mail/?view=cm&fs=1&to=imvannavmi%40gmail.com" target="_blank" rel="noreferrer"><span className="contact-link-icon">@</span><span><small>{t.email}</small><strong>imvannavmi@gmail.com</strong></span></a>
              <a className="contact-link" href="https://github.com/imvannavmi/" target="_blank" rel="noreferrer"><span className="contact-link-icon">⌘</span><span><small>{t.github}</small><strong>github.com/imvannavmi</strong></span></a>
            </div>
          </div>
          <div className="contact-bottom"><span>{locale === "id" ? "STATUS KONEKSI" : "CONNECTION STATUS"} <b>● {locale === "id" ? "TERBUKA UNTUK KERJA, MAGANG & KOLABORASI" : "OPEN TO WORK, INTERNSHIPS & COLLABORATIONS"}</b></span><span>BY.VANIA // {new Date().getFullYear()}</span></div>
        </div>
      </section>
    </main>
    <footer className="footer section-wrap"><a className="brand" href="#home"><span className="brand-mark">&lt;/&gt;</span> by.vania<span className="brand-dot">_</span></a><a href="#home">{locale === "id" ? "Kembali ke atas ↑" : "Back to top ↑"}</a><span>DESIGNED & BUILT WITH CURIOSITY</span></footer>
  </>;
}
