import React from "react";

// Grande carte : le texte à gauche, et à droite Newbi au centre de deux
// anneaux de logos qui tournent lentement en sens inverse. Chaque logo
// contre-tourne pour rester droit.
// Seules les connexions réellement disponibles dans l'app sont affichées.
// `fill` = l'image est déjà une icône carrée avec son fond, elle remplit la
// pastille ; sinon c'est un glyphe posé sur un fond de marque.
const LOGOS = [
  { file: "qonto.png", label: "Qonto", fill: true },
  { file: "gmail.svg", label: "Gmail", bg: "#FFFFFF" },
  { file: "bridge.png", label: "Bridge by Bankin'", fill: true },
  { file: "googlecalendar.svg", label: "Google Agenda", bg: "#FFFFFF" },
  { file: "stripe.svg", label: "Stripe", bg: "#FFFFFF" },
  { file: "outlook.png", label: "Outlook", bg: "#FFFFFF" },
  { file: "pennylane.png", label: "Pennylane", bg: "#FFFFFF" },
  { file: "apple.svg", label: "Agenda Apple", bg: "#FFFFFF" },
  { file: "abby.png", label: "Abby", bg: "#FFFFFF" },
];

// Verre dépoli : le petit cercle est le plus opaque, les suivants
// s'effacent progressivement.
const GLASS = [
  "bg-white/85 border-white/70 backdrop-blur-2xl shadow-[inset_0_2px_8px_rgba(255,255,255,0.95),0_12px_36px_rgba(0,0,0,0.05)]",
  "bg-white/55 border-white/55 backdrop-blur-xl shadow-[inset_0_2px_8px_rgba(255,255,255,0.8),0_10px_30px_rgba(0,0,0,0.035)]",
  "bg-white/30 border-white/45 backdrop-blur-md shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),0_8px_24px_rgba(0,0,0,0.025)]",
];

export default function IntegrationsSection() {
  return (
    <section className="relative px-5 py-14 md:py-20">
      <style>{`
        /* Une seule animation par pastille : elle tourne autour du centre et
           se redresse dans la même image-clé, donc le logo ne peut pas
           basculer, quel que soit le navigateur. */
        @keyframes orbitPath {
          from {
            transform: translate(-50%, -50%) rotate(0deg)
                       translateX(var(--r)) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg)
                       translateX(var(--r)) rotate(-360deg);
          }
        }
        /* Respiration des deux cercles intérieurs, façon niveau sonore.
           Durées non multiples : elles ne retombent jamais en phase.
           Le centrage est porté par la propriété translate de Tailwind,
           donc ces images-clés ne touchent qu'à l'échelle — sinon le
           décalage de -50 % serait appliqué deux fois. */
        @keyframes pulseA {
          0%, 100% { transform: scale(1);     opacity: 1;    }
          22%      { transform: scale(1.045); opacity: 0.94; }
          48%      { transform: scale(0.982); opacity: 1;    }
          74%      { transform: scale(1.022); opacity: 0.97; }
        }
        @keyframes pulseB {
          0%, 100% { transform: scale(1);     opacity: 1;    }
          34%      { transform: scale(0.976); opacity: 1;    }
          58%      { transform: scale(1.038); opacity: 0.93; }
          81%      { transform: scale(0.994); opacity: 1;    }
        }
        @media (prefers-reduced-motion: reduce) {
          .orbitBubble, .orbitRing { animation: none !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] min-h-[440px] md:min-h-[560px] grid md:grid-cols-12">
          {/* Texte */}
          <div className="relative z-10 md:col-span-7 p-8 md:p-12 lg:p-14 flex flex-col justify-center">
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-5">
              Branche Newbi à ce que tu utilises déjà
            </h2>
            <p className="text-[17px] leading-relaxed text-gray-600 max-w-xl">
              Ta banque, tes encaissements Stripe, ton compte Qonto, ta compta
              Pennylane, ta boîte mail et ton agenda : Newbi va chercher
              l&apos;information et la renvoie, sans un seul export manuel.
            </p>
          </div>

          {/* Anneaux */}
          <div
            className="relative md:col-span-5 min-h-[340px] md:min-h-0"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-[38%] md:-translate-x-[34%] size-[620px] md:size-[720px]">
              <Ring size={620} tone={2} />
              <Ring size={440} tone={1} pulse="pulseB 7.3s -3.1s" />
              <Ring size={270} tone={0} pulse="pulseA 4.6s -1.2s" />

              {/* Newbi au centre */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center size-[160px] md:size-[196px] rounded-full bg-[#17171A] shadow-lg">
                <img
                  src="/newbiLetter.png"
                  alt=""
                  /* le logo est noir : on l'inverse en blanc pour le cercle */
                  className="w-[92px] md:w-[112px] brightness-0 invert"
                />
              </span>

              <Orbit items={LOGOS} radius={310} duration={52} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ring({ size, tone, pulse }) {
  const [name, duration, delay] = pulse ? pulse.split(" ") : [];
  return (
    <span
      className={`orbitRing absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${GLASS[tone]}`}
      style={{
        width: size,
        height: size,
        animation: pulse
          ? `${name} ${duration} ${delay} ease-in-out infinite`
          : undefined,
      }}
    />
  );
}

function Orbit({ items, radius, duration }) {
  return items.map((item, i) => (
    <span
      key={item.file}
      className="orbitBubble absolute left-1/2 top-1/2"
      style={{
        "--r": `${radius}px`,
        animation: `orbitPath ${duration}s linear infinite`,
        // chaque logo démarre à sa place sur le cercle
        animationDelay: `${(-i * duration) / items.length}s`,
      }}
    >
      <span
        className="grid place-items-center size-[76px] md:size-[92px] rounded-full overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
        style={{ background: item.fill ? undefined : item.bg }}
      >
        <img
          src={`/lp/home/integrations/${item.file}`}
          alt={item.label}
          className={
            item.fill
              ? "size-full object-cover"
              : "size-10 md:size-11 object-contain"
          }
        />
      </span>
    </span>
  ));
}
