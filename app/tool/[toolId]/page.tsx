import React from "react";
import { prisma } from "@/lib/prisma";
import { ToolDetails } from "./component/toolDetails";
import { Heading } from "@medusajs/ui";
import { ToolCard } from "@/components/toolCard/toolCard";

const getDetails = async ({ toolId }: { toolId: string }) => {
  try {
    const tool = await prisma.tools.findUnique({
      where: {
        toolId: toolId,
      },
      include: {
        tags: {
          include: {
            tools: {
              include: {
                tags: true,
              },
            },
          },
        },
      },
    });
    return tool;
  } catch (e) {
    return null;
  }
};

const Page = async ({ params: { toolId } }: { params: { toolId: string } }) => {
  const toolDetails = await getDetails({ toolId });
  if (toolDetails) {
    return (
      <div className="container px-4 py-3 md:px-8 mx-auto mt-10">
        <ToolDetails tool={toolDetails} />
        <Heading>Related tools</Heading>
        <div>
          <div className="grid grid-cols-3 gap-6">
            {toolDetails.tags.map(({ tools }) => (
              <>
                {tools.map((tool: Tool) => (
                  <ToolCard tool={tool} key={tool.toolId} />
                ))}
              </>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="container px-4 py-3 md:px-8 mx-auto mt-10">
        Page not found
      </div>
    );
  }
};

export default Page;
