import { isDemoMode } from '@/config/env'
import type { Servicios } from '@/services/contratos'
import { crearAjustesDemo } from '@/services/demo/ajustes'
import { crearImagenesDemo } from '@/services/demo/imagenes'
import { crearProductosDemo } from '@/services/demo/productos'
import { crearSesionDemo } from '@/services/demo/sesion'
import { crearVentasDemo } from '@/services/demo/ventas'
import { ajustesRemotos, imagenesRemotas, productosRemotos, sesionRemota, ventasRemotas } from '@/services/remoto/api'

/**
 * El único sitio que decide si la web habla con el backend o con los datos de ejemplo
 * (sin `VITE_API_URL` = modo demo).
 */
export function crearServicios(demo: boolean): Servicios {
  if (demo) {
    // Tras cada cambio en las obras o la portada, se sueltan las fotos subidas que ya nadie usa.
    const imagenes = crearImagenesDemo()
    const liberar = () => imagenes.liberarSinUso(new Set([...productos.fotosEnUso(), ajustes.fotoEnUso()]))
    const productos = crearProductosDemo(liberar)
    const ajustes = crearAjustesDemo(liberar)
    return { productos, ajustes, sesion: crearSesionDemo(), imagenes, ventas: crearVentasDemo(productos) }
  }
  return {
    productos: productosRemotos,
    ajustes: ajustesRemotos,
    sesion: sesionRemota,
    imagenes: imagenesRemotas,
    ventas: ventasRemotas,
  }
}

/*
 * Se crean UNA vez, al cargar el módulo, y nunca desde un componente o un hook: el almacén del
 * demo vive dentro de estos objetos, y crearlos de nuevo borraría las obras dadas de alta en el
 * panel.
 */
const servicios = crearServicios(isDemoMode)

export const productService = servicios.productos
export const settingsService = servicios.ajustes
export const authService = servicios.sesion
export const imagenService = servicios.imagenes
export const ventasService = servicios.ventas
