import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { env } from '@/config/env'

const ACTUALIZADO = '25 de septiembre de 2026'

/**
 * Política de privacidad. Está escrita a partir de lo que la web hace de verdad:
 * si mañana se añade analítica o un formulario, hay que actualizarla.
 */
export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Política de privacidad — AGP Desing'
    return () => {
      document.title = 'AGP Desing - Regalos con intención'
    }
  }, [])

  return (
    <div className="container-x py-16 md:py-24">
      <div className="max-w-[65ch]">
        <p className="label-brand">Legal</p>
        <h1 className="text-h2 mt-3">Política de privacidad</h1>
        <p className="label mt-4">Actualizada el {ACTUALIZADO}</p>

        <div className="mt-12 space-y-10 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-h3 text-ink">Quién responde por tus datos</h2>
            <p className="mt-3">
              AGP Desing, taller de regalos personalizados con sede en Trujillo, La Libertad (Perú).
              Para cualquier asunto sobre tus datos escribe a{' '}
              <a className="link-underline text-ink" href="mailto:agpdesinger@gmail.com">agpdesinger@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Esta web no te pide datos</h2>
            <p className="mt-3">
              No hay formularios de registro, ni newsletter, ni carrito. No usamos cookies de publicidad
              ni herramientas de analítica: no medimos por dónde navegas ni cuánto te quedas. Lo único que
              guardamos en tu navegador es la sesión del panel de administración, y eso solo ocurre si
              entras con usuario y contraseña, que es cosa nuestra, no tuya.
            </p>
            <p className="mt-3">
              Como todo servidor, el que aloja esta web registra las peticiones que recibe, y ahí queda tu
              dirección IP durante un tiempo limitado. Sirve para que la web funcione y para detectar
              abusos; no lo cruzamos con nada.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Lo que hablamos por WhatsApp sí queda guardado</h2>
            <p className="mt-3">
              Los botones de la web abren una conversación de WhatsApp con nosotros. A partir de ahí la
              conversación se guarda en ese servicio y en nuestro teléfono: tu número, tu nombre tal como
              lo tengas puesto, los mensajes, y las fotos o datos que nos envíes para preparar tu encargo
              (nombres, fechas, imágenes, canciones). Usamos eso únicamente para cotizar, fabricar y
              entregar lo que nos pides, y para responderte después si hace falta.
            </p>
            <p className="mt-3">
              WhatsApp es un servicio de Meta y tiene sus propias condiciones, que no controlamos. Si
              prefieres no usarlo, escríbenos al correo de arriba.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Las fotos de los trabajos</h2>
            <p className="mt-3">
              Publicamos fotos de piezas terminadas en el catálogo y en nuestras redes, porque es la forma
              de enseñar lo que hacemos. Antes de publicarlas <strong className="text-ink font-semibold">
              difuminamos o pixelamos las caras</strong> y tapamos los datos que permitan reconocer a
              alguien: nombres completos, fechas concretas, mensajes privados que vayan impresos en la pieza.
            </p>
            <p className="mt-3">
              Si aun así te reconoces en una foto publicada, o simplemente prefieres que no esté, escríbenos
              y la quitamos. No hace falta que expliques por qué.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Con quién compartimos</h2>
            <p className="mt-3">
              Con nadie para fines comerciales. Solo intervienen los proveedores que hacen falta para que
              esto funcione: el servicio que aloja la web, la base de datos donde vive el catálogo, y la
              empresa de transporte cuando hay envío, a la que le damos tu nombre, dirección y teléfono
              porque sin eso no puede entregarte nada.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Cuánto tiempo lo conservamos</h2>
            <p className="mt-3">
              Las conversaciones y las fotos de un encargo, mientras dure la relación y un tiempo razonable
              después por si reclamas o quieres repetir. Los comprobantes, lo que exija la normativa
              tributaria. Cuando ya no hacen falta, se borran.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Tus derechos</h2>
            <p className="mt-3">
              La Ley 29733 de Protección de Datos Personales y su reglamento (Decreto Supremo 016-2024-JUS)
              te dan derecho a saber qué tenemos tuyo, a corregirlo, a que lo borremos y a oponerte a que lo
              usemos. Para ejercerlos basta con un correo a{' '}
              <a className="link-underline text-ink" href="mailto:agpdesinger@gmail.com">agpdesinger@gmail.com</a>{' '}
              diciendo qué quieres; te respondemos en los plazos que marca la ley.
            </p>
            <p className="mt-3">
              Si crees que no te hemos atendido bien, puedes reclamar ante la Autoridad Nacional de
              Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Menores de edad</h2>
            <p className="mt-3">
              No vendemos a menores de edad sin que haya un padre, madre o tutor detrás. Si un encargo
              incluye la imagen o los datos de un menor, pedimos la autorización de quien lo tenga a su
              cargo antes de publicar nada, y aun así pixelamos.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Cambios</h2>
            <p className="mt-3">
              Si cambiamos algo, cambiamos también la fecha de arriba. Si el cambio es importante, lo
              avisamos en la portada.
            </p>
          </section>
        </div>

        <div className="mt-14 pt-8 border-t border-oat flex flex-wrap gap-4">
          <Link to="/terminos" className="btn-secondary">Términos y condiciones</Link>
          <a href={`https://wa.me/${env.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Escríbenos
          </a>
        </div>
      </div>
    </div>
  )
}
