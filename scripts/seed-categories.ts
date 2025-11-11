import { prisma } from "../lib/prisma";

const defaultCategories = [
  {
    name: "News",
    slug: "news",
    description: "Current events and breaking news coverage",
    color: "#3b82f6",
    icon: "newspaper",
  },
  {
    name: "Politics",
    slug: "politics",
    description: "Political commentary and analysis",
    color: "#ef4444",
    icon: "vote",
  },
  {
    name: "Science",
    slug: "science",
    description: "Scientific research and discoveries",
    color: "#10b981",
    icon: "flask",
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    description: "Entertainment news and pop culture",
    color: "#ec4899",
    icon: "film",
  },
  {
    name: "Tech",
    slug: "tech",
    description: "Technology news and innovation",
    color: "#8b5cf6",
    icon: "cpu",
  },
  {
    name: "Business",
    slug: "business",
    description: "Business and economic news",
    color: "#f59e0b",
    icon: "briefcase",
  },
  {
    name: "History",
    slug: "history",
    description: "Historical analysis and documentaries",
    color: "#6366f1",
    icon: "book-open",
  },
  {
    name: "Comedy",
    slug: "comedy",
    description: "Comedy and satirical content",
    color: "#f97316",
    icon: "smile",
  },
  {
    name: "Foreign",
    slug: "foreign",
    description: "International and foreign affairs",
    color: "#06b6d4",
    icon: "globe",
  },
  {
    name: "Domestic",
    slug: "domestic",
    description: "Domestic and local affairs",
    color: "#14b8a6",
    icon: "home",
  },
  {
    name: "Leans Left",
    slug: "leans-left",
    description: "Content with a left-leaning perspective",
    color: "#3b82f6",
    icon: "arrow-left",
  },
  {
    name: "Leans Right",
    slug: "leans-right",
    description: "Content with a right-leaning perspective",
    color: "#ef4444",
    icon: "arrow-right",
  },
  {
    name: "Center",
    slug: "center",
    description: "Centrist or balanced perspective",
    color: "#8b5cf6",
    icon: "minus",
  },
];

async function seedCategories() {
  console.log("🌱 Seeding default categories...");

  for (const category of defaultCategories) {
    try {
      const existing = await prisma.category.findUnique({
        where: { slug: category.slug },
      });

      if (existing) {
        console.log(`   ⏭️  Category "${category.name}" already exists`);
      } else {
        await prisma.category.create({
          data: category,
        });
        console.log(`   ✅ Created category: ${category.name}`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating category ${category.name}:`, error);
    }
  }

  console.log("\n✨ Seeding complete!");
}

seedCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
