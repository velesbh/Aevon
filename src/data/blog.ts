export type Locale = "en" | "es";

export interface BlogPost {
  slug: string;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  content: Record<Locale, string>;
  date: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "aevon-vs-campfire",
    title: { 
      en: "Aevon vs Campfire: Which Worldbuilding App is Right for You?", 
      es: "Aevon vs Campfire: ¿Qué aplicación de creación de mundos es adecuada para ti?" 
    },
    excerpt: {
      en: "A comprehensive comparison between Aevon and Campfire for authors and worldbuilders.",
      es: "Una comparación exhaustiva entre Aevon y Campfire para autores y creadores de mundos."
    },
    date: "2023-10-01",
    content: {
      en: `
# Aevon vs Campfire: Which Worldbuilding App is Right for You?

When it comes to worldbuilding software, authors have more choices than ever. Campfire has been a popular choice for years, but how does the new platform, Aevon, compare?

## Interface and Focus
Campfire offers a vast array of modules, which can be overwhelming for some. Aevon focuses on a minimalist, distraction-free environment (specifically in its signature monochrome and emerald green theme), prioritizing the writing process alongside worldbuilding.

## The Manuscript Integration
While Campfire has manuscript features, Aevon was built from the ground up to seamlessly link your lore to your text. Using the '@' mention system in Aevon instantly connects characters, locations, and items to your growing database without leaving the editor.

## Pricing Model
Campfire uses a modular pricing system where you pay per feature. Aevon offers a more straightforward, all-in-one approach to its tools.

**Conclusion:** If you want a distraction-free environment that tightly integrates your manuscript with your lore, Aevon is the clear winner.
      `,
      es: `
# Aevon vs Campfire: ¿Qué aplicación de creación de mundos es adecuada para ti?

Cuando se trata de software de creación de mundos, los autores tienen más opciones que nunca. Campfire ha sido una opción popular durante años, pero ¿cómo se compara la nueva plataforma, Aevon?

## Interfaz y Enfoque
Campfire ofrece una amplia gama de módulos, que pueden resultar abrumadores para algunos. Aevon se centra en un entorno minimalista y libre de distracciones (específicamente en su tema característico monocromático y verde esmeralda), priorizando el proceso de escritura junto con la creación de mundos.

## La Integración del Manuscrito
Si bien Campfire tiene características de manuscrito, Aevon fue construido desde cero para vincular perfectamente tu lore a tu texto. Usar el sistema de menciones '@' en Aevon conecta instantáneamente personajes, ubicaciones y elementos a tu creciente base de datos sin salir del editor.

## Modelo de Precios
Campfire utiliza un sistema de precios modular donde pagas por característica. Aevon ofrece un enfoque más directo y todo en uno para sus herramientas.

**Conclusión:** Si deseas un entorno libre de distracciones que integre estrechamente tu manuscrito con tu lore, Aevon es el claro ganador.
      `
    }
  },
  {
    slug: "aevon-vs-world-anvil",
    title: { 
      en: "Aevon vs World Anvil: The Ultimate Showdown", 
      es: "Aevon vs World Anvil: El Enfrentamiento Definitivo" 
    },
    excerpt: {
      en: "Discover whether Aevon or World Anvil is the best fit for your next big fantasy or sci-fi project.",
      es: "Descubre si Aevon o World Anvil es la mejor opción para tu próximo gran proyecto de fantasía o ciencia ficción."
    },
    date: "2023-10-05",
    content: {
      en: `
# Aevon vs World Anvil: The Ultimate Showdown

World Anvil is known as the heavyweight champion of worldbuilding wikis, especially for Tabletop RPGs. But for authors, is it the best tool? Enter Aevon.

## The Author's Workflow
World Anvil is built like a massive wiki. It is incredible for displaying public lore to fans or players. However, Aevon is specifically tailored for the *author's* workflow. Aevon's offline-first architecture means you can write anywhere, without relying on a web browser.

## Offline and Desktop Support
World Anvil requires an internet connection. Aevon provides dedicated desktop apps (Windows/Mac/Linux) and mobile apps that work completely offline and sync when you reconnect.

## Visual Relationships
Aevon automatically generates visual relationship webs based on character connections, a feature that requires manual configuration in many other platforms.

**Conclusion:** For a wiki-style public database, World Anvil is great. For a private, offline-capable authoring environment, Aevon takes the crown.
      `,
      es: `
# Aevon vs World Anvil: El Enfrentamiento Definitivo

World Anvil es conocido como el campeón de peso pesado de las wikis de creación de mundos, especialmente para los juegos de rol de mesa. Pero para los autores, ¿es la mejor herramienta? Entra Aevon.

## El Flujo de Trabajo del Autor
World Anvil está construido como una wiki masiva. Es increíble para mostrar lore público a fans o jugadores. Sin embargo, Aevon está diseñado específicamente para el flujo de trabajo del *autor*. La arquitectura primero sin conexión de Aevon significa que puedes escribir en cualquier lugar, sin depender de un navegador web.

## Soporte Sin Conexión y de Escritorio
World Anvil requiere una conexión a Internet. Aevon proporciona aplicaciones de escritorio dedicadas (Windows/Mac/Linux) y aplicaciones móviles que funcionan completamente sin conexión y se sincronizan cuando te vuelves a conectar.

## Relaciones Visuales
Aevon genera automáticamente redes de relaciones visuales basadas en conexiones de personajes, una característica que requiere configuración manual en muchas otras plataformas.

**Conclusión:** Para una base de datos pública estilo wiki, World Anvil es genial. Para un entorno de autoría privado y con capacidad sin conexión, Aevon se lleva la corona.
      `
    }
  },
  {
    slug: "best-writing-apps",
    title: { 
      en: "The Best Writing Apps for Novelists in 2024", 
      es: "Las Mejores Aplicaciones de Escritura para Novelistas en 2024" 
    },
    excerpt: {
      en: "A roundup of the top software tools for writing a novel, featuring Scrivener, Aevon, and more.",
      es: "Un resumen de las mejores herramientas de software para escribir una novela, con Scrivener, Aevon y más."
    },
    date: "2023-10-10",
    content: {
      en: `
# The Best Writing Apps for Novelists in 2024

Writing a novel is a monumental task, but the right software can make it significantly easier. Here are our top picks for 2024:

## 1. Aevon
Aevon combines a distraction-free manuscript editor with a powerful, integrated lore database. Its ability to '@' mention characters directly in the text and view their profiles instantly makes it our top choice for worldbuilders.

## 2. Scrivener
The classic powerhouse. Scrivener is fantastic for organizing massive documents and structural editing. However, its interface can feel dated, and it lacks modern cloud-sync features out of the box.

## 3. Google Docs
Perfect for collaboration and simple writing, but it lacks the organizational tools necessary for complex, multi-chapter novels with deep lore.

**Summary:** While Scrivener remains a staple, Aevon is rapidly becoming the modern standard for authors who need integrated worldbuilding.
      `,
      es: `
# Las Mejores Aplicaciones de Escritura para Novelistas en 2024

Escribir una novela es una tarea monumental, pero el software adecuado puede facilitarla significativamente. Aquí están nuestras mejores selecciones para 2024:

## 1. Aevon
Aevon combina un editor de manuscritos libre de distracciones con una poderosa base de datos de lore integrada. Su capacidad para mencionar personajes con '@' directamente en el texto y ver sus perfiles al instante lo convierte en nuestra mejor opción para los creadores de mundos.

## 2. Scrivener
La potencia clásica. Scrivener es fantástico para organizar documentos masivos y la edición estructural. Sin embargo, su interfaz puede parecer anticuada y carece de funciones modernas de sincronización en la nube desde el principio.

## 3. Google Docs
Perfecto para la colaboración y la escritura simple, pero carece de las herramientas organizativas necesarias para novelas complejas de varios capítulos con un lore profundo.

**Resumen:** Si bien Scrivener sigue siendo un elemento básico, Aevon se está convirtiendo rápidamente en el estándar moderno para los autores que necesitan una creación de mundos integrada.
      `
    }
  },
  {
    slug: "aevon-v1-launch",
    title: { 
      en: "Aevon v1.0 Launch: The Future of Worldbuilding", 
      es: "Lanzamiento de Aevon v1.0: El Futuro de la Creación de Mundos" 
    },
    excerpt: {
      en: "Announcing the official release of Aevon. Discover all the new features and improvements.",
      es: "Anunciando el lanzamiento oficial de Aevon. Descubre todas las nuevas características y mejoras."
    },
    date: "2023-10-15",
    content: {
      en: `
# Aevon v1.0 Launch: The Future of Worldbuilding

We are incredibly excited to announce the official launch of Aevon v1.0! 

After months of rigorous beta testing and invaluable feedback from our community of authors and game masters, Aevon is finally ready for the public.

## What's New?
- **Seamless Cloud Sync:** Work completely offline and automatically sync when you reconnect.
- **Interactive Maps:** Pin your lore directly to high-resolution images of your world.
- **Relationship Graphs:** Automatically visualize the complex dynamics between your characters and factions.
- **The Obsidian Theme:** Our signature monochrome and emerald green aesthetic provides the ultimate distraction-free writing sanctuary.

Thank you to everyone who supported us during the beta. The future of worldbuilding is here.
      `,
      es: `
# Lanzamiento de Aevon v1.0: El Futuro de la Creación de Mundos

¡Estamos increíblemente emocionados de anunciar el lanzamiento oficial de Aevon v1.0!

Después de meses de rigurosas pruebas beta y comentarios invaluables de nuestra comunidad de autores y directores de juego, Aevon finalmente está listo para el público.

## ¿Qué hay de nuevo?
- **Sincronización Perfecta en la Nube:** Trabaja completamente sin conexión y sincroniza automáticamente cuando te vuelvas a conectar.
- **Mapas Interactivos:** Fija tu lore directamente a imágenes de alta resolución de tu mundo.
- **Gráficos de Relaciones:** Visualiza automáticamente la compleja dinámica entre tus personajes y facciones.
- **El Tema Obsidiana:** Nuestra estética característica monocromática y verde esmeralda proporciona el último santuario de escritura libre de distracciones.

Gracias a todos los que nos apoyaron durante la beta. El futuro de la creación de mundos está aquí.
      `
    }
  }
];
