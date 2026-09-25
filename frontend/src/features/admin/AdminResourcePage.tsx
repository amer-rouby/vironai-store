"use client";

import { ResourceManager } from "./engine/ResourceManager";
import type { ResourceKey } from "./engine/types";
import { resourceRegistry } from "./resources";

export function AdminResourcePage({ resource }: { resource: ResourceKey }) {
  return <ResourceManager key={resource} resource={resource} registry={resourceRegistry} />;
}
