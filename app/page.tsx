import { LandingClient } from "./LandingClient";

const translations = {
  en: {
    nav_logo: "SmartFit Planner",
    nav_workout: "Workouts",
    nav_diet: "Diet",
    nav_sessions: "Sessions",
    nav_login: "Log in",
    nav_signup: "Sign up",

    hero_title: "AI-powered workouts, meals and session tracking.",
    hero_subtitle:
      "SmartFit Planner builds simple workout plans, realistic diet ideas and an easy workout log in one place.",
    hero_cta_primary: "Get started free",
    hero_cta_secondary: "See how it works",

    hero_bullet_1: "🏋️ Personalized workout plans",
    hero_bullet_2: "🍽️ Simple AI diet ideas",
    hero_bullet_3: "📊 Workout session tracker",

    section_how_title: "How SmartFit Planner works",
    section_how_step1_title: "1. Tell us about you",
    section_how_step1_body:
      "Set your goal, experience level, days per week, equipment and food preferences.",
    section_how_step2_title: "2. Generate your plan with AI",
    section_how_step2_body:
      "Our AI suggests a weekly workout routine and simple meal ideas that fit your info.",
    section_how_step3_title: "3. Log your sessions",
    section_how_step3_body:
      "Track sets, weight and reps for every exercise and see how your consistency grows.",

    section_workout_title: "Workout plans that fit your life",
    section_workout_body:
      "SmartFit Planner uses AI to build beginner-friendly workouts around your schedule, level and equipment. It focuses on simple movements and low to moderate intensity, with clear sets and reps for each day.",
    section_workout_cta: "Generate my first workout",

    section_diet_title: "Simple, realistic diet ideas",
    section_diet_body:
      "Based on your diet type, allergies and foods you don’t like, SmartFit suggests example breakfasts, lunches, dinners and snacks with common, easy-to-find ingredients. No extreme or very restrictive diets.",
    section_diet_cta: "See a sample diet plan",

    section_session_title: "Turn plans into real progress",
    section_session_body:
      "Choose the day from your plan, log each set with kg and reps, mark what you finished and add notes if needed. SmartFit stores your session time, intensity and comments to help you see your progress over time.",
    section_session_cta: "Start logging a session",

    section_disclaimer_title: "Safety first",
    section_disclaimer_body:
      "SmartFit Planner is for general information and learning only. It is not medical advice and does not replace a doctor, nutritionist or trainer. Always talk to a health professional before starting a new workout or diet, especially if you feel pain, discomfort or have any health condition.",

    section_final_title: "Ready to plan your next week?",
    section_final_body:
      "Create your profile, generate your AI workout and log your next session in a few minutes.",
    section_final_cta_primary: "Create free account",
    section_final_cta_secondary: "Log in"
  },

  pt: {
    nav_logo: "SmartFit Planner",
    nav_workout: "Treinos",
    nav_diet: "Dieta",
    nav_sessions: "Sessões",
    nav_login: "Entrar",
    nav_signup: "Criar conta",

    hero_title: "Treinos, refeições e sessões com ajuda de IA.",
    hero_subtitle:
      "O SmartFit Planner cria planos de treino simples, ideias de refeições equilibradas e um registo fácil das tuas sessões.",
    hero_cta_primary: "Começar grátis",
    hero_cta_secondary: "Ver como funciona",

    hero_bullet_1: "🏋️ Planos de treino personalizados",
    hero_bullet_2: "🍽️ Ideias de dieta com IA",
    hero_bullet_3: "📊 Registo de sessões de treino",

    section_how_title: "Como funciona o SmartFit Planner",
    section_how_step1_title: "1. Fala-nos sobre ti",
    section_how_step1_body:
      "Define o teu objetivo, nível, dias por semana, equipamento e preferências alimentares.",
    section_how_step2_title: "2. Gera o teu plano com IA",
    section_how_step2_body:
      "A IA sugere uma rotina semanal de treino e ideias de refeições simples de acordo com a tua informação.",
    section_how_step3_title: "3. Regista as tuas sessões",
    section_how_step3_body:
      "Regista séries, peso e repetições em cada exercício e acompanha a tua consistência ao longo do tempo.",

    section_workout_title: "Planos de treino que encaixam na tua vida",
    section_workout_body:
      "O SmartFit Planner usa IA para criar treinos para iniciantes, adaptados ao teu horário, nível e equipamento. Foca-se em movimentos simples e intensidade baixa a moderada, com séries e repetições claras para cada dia.",
    section_workout_cta: "Gerar o meu primeiro treino",

    section_diet_title: "Ideias de dieta simples e realistas",
    section_diet_body:
      "Com base no teu tipo de dieta, alergias e alimentos de que não gostas, o SmartFit sugere exemplos de pequenos-almoços, almoços, jantares e snacks com ingredientes comuns e fáceis de encontrar. Nada de dietas extremas ou demasiado restritivas.",
    section_diet_cta: "Ver exemplo de plano alimentar",

    section_session_title: "Transforma planos em progresso real",
    section_session_body:
      "Escolhe o dia do plano, regista cada série com kg e repetições, marca o que concluíste e adiciona notas se for preciso. O SmartFit guarda o tempo de sessão, intensidade e comentários para acompanhares a tua evolução.",
    section_session_cta: "Começar a registar uma sessão",

    section_disclaimer_title: "Segurança em primeiro lugar",
    section_disclaimer_body:
      "O SmartFit Planner serve apenas para informação geral e aprendizagem. Não é aconselhamento médico e não substitui médico, nutricionista ou treinador. Fala sempre com um profissional de saúde antes de iniciar um novo treino ou dieta, especialmente se sentires dor, desconforto ou tiveres alguma condição de saúde.",

    section_final_title: "Pronto para planear a próxima semana?",
    section_final_body:
      "Cria o teu perfil, gera um treino com IA e regista a tua próxima sessão em poucos minutos.",
    section_final_cta_primary: "Criar conta grátis",
    section_final_cta_secondary: "Entrar"
  },

  es: {
    nav_logo: "SmartFit Planner",
    nav_workout: "Entrenamientos",
    nav_diet: "Dieta",
    nav_sessions: "Sesiones",
    nav_login: "Iniciar sesión",
    nav_signup: "Crear cuenta",

    hero_title: "Entrenamientos, comidas y sesiones con ayuda de IA.",
    hero_subtitle:
      "SmartFit Planner crea planes de entrenamiento simples, ideas de comida realistas y un registro fácil de sesiones en un solo lugar.",
    hero_cta_primary: "Comenzar gratis",
    hero_cta_secondary: "Ver cómo funciona",

    hero_bullet_1: "🏋️ Planes de entrenamiento personalizados",
    hero_bullet_2: "🍽️ Ideas de dieta con IA",
    hero_bullet_3: "📊 Registro de sesiones de entrenamiento",

    section_how_title: "Cómo funciona SmartFit Planner",
    section_how_step1_title: "1. Cuéntanos sobre ti",
    section_how_step1_body:
      "Define tu objetivo, nivel, días por semana, equipo y preferencias de comida.",
    section_how_step2_title: "2. Genera tu plan con IA",
    section_how_step2_body:
      "La IA sugiere una rutina semanal de entrenamiento e ideas de comidas simples según tu información.",
    section_how_step3_title: "3. Registra tus sesiones",
    section_how_step3_body:
      "Registra series, peso y repeticiones en cada ejercicio y sigue tu constancia con el tiempo.",

    section_workout_title: "Planes de entrenamiento que se adaptan a tu vida",
    section_workout_body:
      "SmartFit Planner usa IA para crear entrenamientos para principiantes según tu horario, nivel y equipo. Se enfoca en movimientos simples e intensidad baja a moderada, con series y repeticiones claras para cada día.",
    section_workout_cta: "Generar mi primer entrenamiento",

    section_diet_title: "Ideas de dieta simples y realistas",
    section_diet_body:
      "Según tu tipo de dieta, alergias y alimentos que no te gustan, SmartFit sugiere ejemplos de desayunos, almuerzos, cenas y snacks con ingredientes comunes y fáciles de encontrar. Nada de dietas extremas o muy restrictivas.",
    section_diet_cta: "Ver ejemplo de plan de dieta",

    section_session_title: "Convierte planes en progreso real",
    section_session_body:
      "Elige el día del plan, registra cada serie con kg y repeticiones, marca lo que completaste y agrega notas si es necesario. SmartFit guarda el tiempo de sesión, la intensidad y los comentarios para ayudarte a ver tu progreso.",
    section_session_cta: "Comenzar a registrar una sesión",

    section_disclaimer_title: "Seguridad primero",
    section_disclaimer_body:
      "SmartFit Planner es solo para información general y aprendizaje. No es consejo médico ni reemplaza a un médico, nutricionista o entrenador. Habla siempre con un profesional de salud antes de empezar un nuevo entrenamiento o dieta, especialmente si sientes dolor, molestias o tienes alguna condición de salud.",

    section_final_title: "¿Listo para planear tu próxima semana?",
    section_final_body:
      "Crea tu perfil, genera tu entrenamiento con IA y registra tu próxima sesión en pocos minutos.",
    section_final_cta_primary: "Crear cuenta gratis",
    section_final_cta_secondary: "Iniciar sesión"
  }
} as const;

export default function HomePage() {
  return <LandingClient translations={translations} />;
}
