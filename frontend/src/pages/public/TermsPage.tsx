import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { env } from '@/config/env'

const ACTUALIZADO = '25 de septiembre de 2026'

export function TermsPage() {
  useEffect(() => {
    document.title = 'Términos y condiciones — AGP Desing'
    return () => {
      document.title = 'AGP Desing - Regalos con intención'
    }
  }, [])

  return (
    <div className="container-x py-16 md:py-24">
      <div className="max-w-[65ch]">
        <p className="label-brand">Legal</p>
        <h1 className="text-h2 mt-3">Términos y condiciones</h1>
        <p className="label mt-4">Actualizados el {ACTUALIZADO}</p>

        <div className="mt-12 space-y-10 text-ink-soft leading-relaxed">
          <section>
            <h2 className="text-h3 text-ink">Quiénes somos</h2>
            <p className="mt-3">
              AGP Desing, taller de regalos personalizados en Trujillo, La Libertad (Perú). Contacto:{' '}
              <a className="link-underline text-ink" href="mailto:agpdesinger@gmail.com">agpdesinger@gmail.com</a>{' '}
              y WhatsApp. Al usar esta web aceptas lo que dice esta página.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Aquí no se compra: se cotiza</h2>
            <p className="mt-3">
              Esta web es un catálogo. No hay carrito ni pasarela de pago, y nada de lo que veas constituye
              una oferta cerrada. Cuando pulsas un botón de cotizar, se abre WhatsApp y a partir de ahí
              acordamos el encargo persona a persona.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Los precios del catálogo son referenciales</h2>
            <p className="mt-3">
              Están en soles e indican el punto de partida de cada tipo de pieza. El precio final depende
              del tamaño, del nivel de personalización y de los materiales, y se confirma por WhatsApp antes
              de empezar. Mientras no lo confirmemos por escrito, no hay precio cerrado.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Cómo se encarga y se paga</h2>
            <p className="mt-3">
              Un encargo empieza cuando aceptas el presupuesto y abonas el 50 %. El resto se paga al
              terminar, antes del envío o de la entrega. Aceptamos Yape, Plin y transferencia.
            </p>
            <p className="mt-3">
              Para que podamos trabajar necesitamos que nos envíes el material a tiempo (fotos, nombres,
              fechas, referencias). Si tarda en llegar, el plazo se corre.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Plazos y entregas</h2>
            <p className="mt-3">
              El plazo se acuerda en cada encargo y depende de la complejidad. Hacemos entregas en Trujillo
              y envíos al resto del país; el costo del envío se cotiza aparte y corre por cuenta del cliente
              salvo que acordemos otra cosa. Una vez que la pieza sale con el transportista, los retrasos o
              daños del transporte no dependen de nosotros, aunque te ayudaremos a reclamar.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Cambios, cancelaciones y devoluciones</h2>
            <p className="mt-3">
              Puedes pedir ajustes mientras el encargo esté en diseño, sin costo. Una vez empezada la
              producción, los cambios pueden suponer un costo adicional que te diremos antes de hacerlos.
            </p>
            <p className="mt-3">
              Si cancelas después de que hayamos empezado, el adelanto cubre el trabajo ya hecho y los
              materiales comprados. Al tratarse de piezas fabricadas a medida con tus datos, no admitimos
              devolución por cambio de opinión.
            </p>
            <p className="mt-3">
              Lo que sí cubrimos siempre: si la pieza llega dañada, tiene un defecto de fabricación o no
              corresponde a lo acordado, avísanos con fotos dentro de los 7 días siguientes a recibirla y la
              reponemos o te devolvemos el dinero. Esto no recorta los derechos que te da el Código de
              Protección y Defensa del Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Lo que nos envías</h2>
            <p className="mt-3">
              Al mandarnos fotos, textos o imágenes para tu encargo nos confirmas que puedes usarlas: que
              son tuyas o que tienes permiso de quien aparece o de quien las hizo. Nos autorizas a usarlas
              solo para fabricar tu pieza.
            </p>
            <p className="mt-3">
              Podemos publicar fotos del resultado en el catálogo y en nuestras redes, siempre con las caras
              pixeladas y sin datos que identifiquen a nadie, como explicamos en la{' '}
              <Link to="/privacidad" className="link-underline text-ink">política de privacidad</Link>. Si
              no quieres que publiquemos tu pieza, dilo y no lo hacemos.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Marcas de terceros</h2>
            <p className="mt-3">
              Algunos encargos hacen referencia a equipos, artistas, plataformas o personajes que pertenecen
              a sus respectivos dueños. AGP Desing no está asociada con ellos ni los representa, y esas
              referencias se usan a petición del cliente para un objeto único y de uso personal. Los diseños
              propios, las fotos y los textos de esta web son nuestros.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Hasta dónde respondemos</h2>
            <p className="mt-3">
              Respondemos por la pieza que fabricamos. No respondemos de los usos que le des después, ni de
              fallos ajenos como cortes de internet, caídas de WhatsApp o problemas del transportista.
            </p>
          </section>

          <section>
            <h2 className="text-h3 text-ink">Ley aplicable</h2>
            <p className="mt-3">
              Se aplica la ley peruana. Cualquier desacuerdo intentaremos resolverlo hablando; si no hay
              manera, se verá ante los jueces de Trujillo. También puedes acudir a Indecopi.
            </p>
          </section>
        </div>

        <div className="mt-14 pt-8 border-t border-oat flex flex-wrap gap-4">
          <Link to="/privacidad" className="btn-secondary">Política de privacidad</Link>
          <a href={`https://wa.me/${env.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Escríbenos
          </a>
        </div>
      </div>
    </div>
  )
}
