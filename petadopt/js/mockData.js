/**
 * Dados de exemplo usados apenas no "modo demonstração"
 * (quando o Supabase ainda não foi configurado ou não pôde
 * ser alcançado). Nunca são usados quando o app está
 * conectado a um projeto Supabase real.
 */
window.DEMO_ORG = {
  id: "demo-org-1",
  org_name: "Abrigo Amigo Fiel (exemplo)",
  contact_email: "contato@amigofiel.exemplo",
  contact_whatsapp: "5511999990000",
};

window.DEMO_PETS = [
  {
    id: "demo-1",
    org_id: "demo-org-1",
    name: "Caramelo",
    species: "cachorro",
    size: "Médio",
    age_label: "2 anos",
    description: "Muito brincalhão, adora crianças e já é castrado. Ótimo com outros cães.",
    photo_url: "https://images.unsplash.com/photo-1558788353-f76d92427f16?q=80&w=600&auto=format&fit=crop",
    status: "disponivel",
    vaccinated: true,
    dewormed: true,
    neutered: true,
    created_at: "2026-06-01T12:00:00Z",
  },
  {
    id: "demo-2",
    org_id: "demo-org-1",
    name: "Mia",
    species: "gato",
    size: "Pequeno",
    age_label: "8 meses",
    description: "Gatinha dócil, vacinada e vermifugada. Se dá bem sozinha ou com outros gatos.",
    photo_url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop",
    status: "disponivel",
    vaccinated: true,
    dewormed: true,
    neutered: false,
    created_at: "2026-06-03T12:00:00Z",
  },
  {
    id: "demo-3",
    org_id: "demo-org-1",
    name: "Thor",
    species: "cachorro",
    size: "Grande",
    age_label: "4 anos",
    description: "Cão de guarda tranquilo, já treinado. Está em visita com uma família interessada.",
    photo_url: "https://images.unsplash.com/photo-1517849845537-4d257902861a?q=80&w=600&auto=format&fit=crop",
    status: "em_processo",
    vaccinated: true,
    dewormed: true,
    neutered: true,
    created_at: "2026-05-20T12:00:00Z",
  },
  {
    id: "demo-4",
    org_id: "demo-org-1",
    name: "Luna",
    species: "gato",
    size: "Pequeno",
    age_label: "1 ano",
    description: "Curiosa e carinhosa, adora um colo à tarde.",
    photo_url: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=600&auto=format&fit=crop",
    status: "adotado",
    vaccinated: true,
    dewormed: true,
    neutered: true,
    created_at: "2026-04-15T12:00:00Z",
  },
];

/** Interesses de exemplo, só para ilustrar a tela de admin no modo demonstração. */
window.DEMO_INTERESTS = {
  "demo-3": [
    {
      id: "demo-interest-1",
      pet_id: "demo-3",
      name: "Fernanda Alves",
      email: "fernanda@exemplo.com",
      phone: "11988887777",
      message: "Tenho quintal grande e já cuidei de cães de porte grande antes.",
      created_at: "2026-06-10T15:30:00Z",
    },
  ],
};
