import { isPublicComponent } from '../../DS1/0-face/component-visibility';
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const publicDocsLoader = docsLoader();
const loadDocs = publicDocsLoader.load;
publicDocsLoader.load = async (context) => {
  await loadDocs(context);
  for (const [id] of context.store.entries()) {
    if (!isPublicComponent(id.split('/').at(-1)!)) context.store.delete(id);
  }
};

export const collections = {
	docs: defineCollection({ loader: publicDocsLoader, schema: docsSchema() }),
};
