export type Locale = "en" | "es";

export interface DocPage {
  slug: string;
  title: Record<Locale, string>;
  content: Record<Locale, string>;
}

export const docPages: DocPage[] = [
  {
    slug: "introduction",
    title: { en: "Introduction", es: "Introducción" },
    content: {
      en: `
# Welcome to Aevon

Aevon is a premium novel planning and world-building platform designed for authors, tabletop game masters, and creative writers. Our goal is to provide a unified workspace where your manuscript, maps, characters, and lore are intimately connected.

## Getting Started

To get started, simply create an account or log in. Once inside, you can create your first **Project**. A project acts as a container for your entire universe.

Aevon is designed with a distraction-free, monochrome and emerald green interface to help you focus entirely on your writing.
      `,
      es: `
# Bienvenido a Aevon

Aevon es una plataforma premium de planificación de novelas y creación de mundos diseñada para autores, directores de juegos de mesa y escritores creativos. Nuestro objetivo es proporcionar un espacio de trabajo unificado donde tu manuscrito, mapas, personajes y lore estén íntimamente conectados.

## Empezando

Para empezar, simplemente crea una cuenta o inicia sesión. Una vez dentro, puedes crear tu primer **Proyecto**. Un proyecto actúa como un contenedor para todo tu universo.

Aevon está diseñado con una interfaz libre de distracciones, monocromática y verde esmeralda para ayudarte a concentrarte completamente en tu escritura.
      `
    }
  },
  {
    slug: "manuscript-editor",
    title: { en: "Manuscript Editor", es: "Editor de Manuscrito" },
    content: {
      en: `
# Manuscript Editor

The Aevon manuscript editor is designed for focused writing. 

## Distraction-Free Environment
Our minimalist interface removes clutter, allowing you to focus purely on your words. 

## Mentions and Linking
You can type \`@\` to instantly reference characters, locations, or items from your world database. These references become clickable links, ensuring you always have context about the elements you are writing about.

## Auto-Saving
Your manuscript is automatically saved as you type, ensuring you never lose your progress.
      `,
      es: `
# Editor de Manuscrito

El editor de manuscritos de Aevon está diseñado para la escritura enfocada.

## Entorno Libre de Distracciones
Nuestra interfaz minimalista elimina el desorden, permitiéndote concentrarte puramente en tus palabras.

## Menciones y Enlaces
Puedes escribir \`@\` para hacer referencia instantánea a personajes, ubicaciones o elementos de la base de datos de tu mundo. Estas referencias se convierten en enlaces en los que se puede hacer clic, asegurando que siempre tengas contexto sobre los elementos sobre los que estás escribiendo.

## Guardado Automático
Tu manuscrito se guarda automáticamente a medida que escribes, asegurando que nunca pierdas tu progreso.
      `
    }
  },
  {
    slug: "interactive-map",
    title: { en: "Interactive Map", es: "Mapa Interactivo" },
    content: {
      en: `
# Interactive Map

Visualizing your world is critical to consistent storytelling. Aevon's interactive map feature allows you to upload custom map images and place interactive waypoints.

## Uploading a Map
Navigate to the Atlas section and upload a high-resolution image of your world map. 

## Placing Waypoints
Click anywhere on the map to drop a waypoint. You can name these waypoints and attach notes or link them directly to Location entries in your lore database. This ensures that when your characters travel, you know exactly what is there.
      `,
      es: `
# Mapa Interactivo

Visualizar tu mundo es fundamental para una narración coherente. La función de mapa interactivo de Aevon te permite cargar imágenes de mapas personalizados y colocar puntos de referencia interactivos.

## Subiendo un Mapa
Navega a la sección Atlas y carga una imagen de alta resolución de tu mapa del mundo.

## Colocando Puntos de Referencia
Haz clic en cualquier lugar del mapa para soltar un punto de referencia. Puedes nombrar estos puntos de referencia y adjuntar notas o vincularlos directamente a las entradas de Ubicación en tu base de datos de lore. Esto asegura que cuando tus personajes viajen, sepas exactamente qué hay allí.
      `
    }
  },
  {
    slug: "lore-database",
    title: { en: "Lore Database", es: "Base de Datos de Lore" },
    content: {
      en: `
# Lore Database

Your world is built on details. The Lore Database is where you organize everything.

## Characters, Locations, Items
Create detailed profiles for the elements of your story. Each entry can contain descriptions, history, rules, and attachments.

## Relationship Web
Aevon automatically generates visual node-based graphs of your characters' relationships based on the connections you define. See who is allied, who is enemies, and who is secretly related.
      `,
      es: `
# Base de Datos de Lore

Tu mundo se construye sobre detalles. La Base de Datos de Lore es donde organizas todo.

## Personajes, Ubicaciones, Objetos
Crea perfiles detallados para los elementos de tu historia. Cada entrada puede contener descripciones, historial, reglas y archivos adjuntos.

## Red de Relaciones
Aevon genera automáticamente gráficos visuales basados en nodos de las relaciones de tus personajes en función de las conexiones que defines. Mira quiénes son aliados, quiénes son enemigos y quiénes están secretamente emparentados.
      `
    }
  },
  {
    slug: "syncing",
    title: { en: "Syncing (Desktop/Mobile)", es: "Sincronización (Escritorio/Móvil)" },
    content: {
      en: `
# Syncing and Offline Mode

Aevon is built to be resilient. Whether you are on an airplane, in a cabin in the woods, or at your desk.

## Offline First
Aevon stores your data locally first. You can write your manuscript, create characters, and update lore entirely offline.

## Cloud Synchronization
Once you reconnect to the internet, Aevon automatically syncs your local changes to your secure cloud workspace. You can seamlessly switch between the desktop app, mobile app, and web browser.
      `,
      es: `
# Sincronización y Modo Sin Conexión

Aevon está construido para ser resistente. Ya sea que estés en un avión, en una cabaña en el bosque o en tu escritorio.

## Primero Sin Conexión
Aevon almacena tus datos localmente primero. Puedes escribir tu manuscrito, crear personajes y actualizar el lore completamente sin conexión.

## Sincronización en la Nube
Una vez que te vuelves a conectar a Internet, Aevon sincroniza automáticamente tus cambios locales con tu espacio de trabajo seguro en la nube. Puedes cambiar sin problemas entre la aplicación de escritorio, la aplicación móvil y el navegador web.
      `
    }
  }
];
