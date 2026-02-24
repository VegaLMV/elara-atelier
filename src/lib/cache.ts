import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

/**
 * Cache wrapper para StoreSettings
 * Revalida cada hora (3600 segundos)
 */
export const getCachedStoreSettings = unstable_cache(
    async () => {
        return await prisma.storeSettings.findFirst();
    },
    ['store-settings'],
    { revalidate: 3600, tags: ['store-settings'] }
);

/**
 * Cache wrapper para Navigation Items
 * Revalida cada 30 minutos
 */
export const getCachedNavigation = unstable_cache(
    async () => {
        return await prisma.navigationItem.findMany({
            orderBy: { order: 'asc' },
            where: { enabled: true }
        });
    },
    ['navigation'],
    { revalidate: 1800, tags: ['navigation'] }
);

/**
 * Cache wrapper para Social Links
 * Revalida cada hora
 */
export const getCachedSocialLinks = unstable_cache(
    async () => {
        return await prisma.socialLink.findMany({
            orderBy: { order: 'asc' },
            where: { enabled: true }
        });
    },
    ['social-links'],
    { revalidate: 3600, tags: ['social-links'] }
);

/**
 * Cache wrapper para Home Sections
 * Revalida cada 10 minutos (contenido más dinámico)
 */
export const getCachedHomeSections = unstable_cache(
    async () => {
        return await prisma.homeSection.findMany({
            where: { enabled: true },
            orderBy: { order: 'asc' }
        });
    },
    ['home-sections'],
    { revalidate: 600, tags: ['home-sections'] }
);

/**
 * Cache wrapper para Categorías Visibles
 * Revalida cada 15 minutos
 */
export const getCachedCategoriasVisibles = unstable_cache(
  async () => {
    return await prisma.categoria.findMany({
      where: { 
        visible: true // 1. Solo trae las visibles
      },
      include: {
        imagenes: {
          orderBy: { orden: 'asc' }
        },
        // 2. 🔥 ESTA LÍNEA ES LA MAGIA PARA EL "PRÓXIMAMENTE"
        _count: {
          select: { productos: true }
        }
      },
      orderBy: {
        orden: 'asc'
      }
    });
  },
  ['categorias-visibles-v1'],
  { revalidate: 60, tags: ['categorias'] }
);

/**
 * Función helper para invalidar cache manualmente
 * Úsala en mutations (POST, PUT, DELETE) para actualizar datos
 */
export async function revalidateCache(tag: string) {
    'use server';
    const { revalidateTag } = require('next/cache');
    revalidateTag(tag);
}
