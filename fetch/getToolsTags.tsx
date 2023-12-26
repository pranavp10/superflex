"use server";

import { pageSize } from "@/data/constants";
import { mappedTags } from "@/data/tags";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getTags = cache(async (): Promise<Tag[] | undefined> => {
  try {
    const allTags = await prisma.tags.findMany({
      orderBy: { name: "asc" },
      include: { tools: { where: { isToolPublished: true } } },
    });
    const tags = allTags.filter((tags) => !!tags.tools.length);
    return tags;
  } catch (e) {
    throw "Something when wrong";
  }
});

export const getToolsTags = cache(
  async ({ page }: { page: number }): Promise<Tool[] | undefined> => {
    const skip = (page - 1) * pageSize;
    try {
      const tools = await prisma.tools.findMany({
        include: { tags: true },
        orderBy: { name: "asc" },
        where: { isToolPublished: true },
        skip: skip,
        take: pageSize,
      });
      return JSON.parse(JSON.stringify(tools));
    } catch (e) {
      return undefined;
    }
  }
);

export const searchTool = cache(
  async ({
    query,
    page,
  }: {
    query: string;
    page: number;
  }): Promise<Tool[] | undefined> => {
    const skip = (page - 1) * pageSize;
    try {
      const tools = await prisma.tools.findMany({
        include: { tags: true },
        where: {
          OR: [
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              summary: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
          isToolPublished: true,
        },
        skip,
        take: pageSize,
      });
      return tools;
    } catch (e) {
      return undefined;
    }
  }
);

export const getToolsByTagSlug = cache(
  async ({ slug }: { slug: string }): Promise<Tool[] | undefined> => {
    const relatedTags = mappedTags.find((mappedTag) => mappedTag.slug === slug);

    try {
      const tag = await prisma.tags.findUnique({
        where: {
          slug,
        },
        include: {
          tools: {
            where: {
              tags: { some: { slug: { in: relatedTags?.map } } },
              isToolPublished: true,
            },
            include: { tags: true },
            distinct: ["toolId"],
          },
        },
      });
      return tag?.tools;
    } catch (e) {
      return undefined;
    }
  }
);

export const getTagBySlug = cache(
  async ({ slug }: { slug: string }): Promise<Tag | undefined> => {
    try {
      const tag = await prisma.tags.findUnique({
        where: {
          slug,
        },
      });
      return tag ? tag : undefined;
    } catch (e) {
      return undefined;
    }
  }
);

export const getToolsDetails = cache(
  async ({
    slug,
  }: {
    slug: string;
  }): Promise<{ toolDetails: Tool; relatedTools: Tool[] } | undefined> => {
    try {
      const toolDetails = await prisma.tools.findUnique({
        where: {
          slug,
        },
        include: {
          tags: true,
        },
      });
      if (toolDetails) {
        const relatedTools = await prisma.tools.findMany({
          where: {
            tags: {
              some: { slug: { in: toolDetails.tags.map((tag) => tag.slug) } },
            },
          },
          include: {
            tags: true,
          },
          distinct: ["toolId"],
        });
        const filterTools = relatedTools.filter(
          (tool: Tool) => tool.toolId !== toolDetails.toolId
        );
        return { toolDetails, relatedTools: filterTools };
      }
    } catch (e) {
      return undefined;
    }
  }
);
