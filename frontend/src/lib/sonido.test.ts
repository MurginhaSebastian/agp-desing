import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// El módulo guarda `ctx` y `pop` a nivel de módulo: cada prueba lo importa de nuevo.
async function cargar() {
  vi.resetModules()
  return (await import('./sonido')).escucharClics
}

let start: ReturnType<typeof vi.fn>
let createBufferSource: ReturnType<typeof vi.fn>
let resume: ReturnType<typeof vi.fn>
let crearContexto: () => void
let fetchMock: ReturnType<typeof vi.fn>

function instalarAudio(state = 'running') {
  start = vi.fn()
  createBufferSource = vi.fn(() => ({ buffer: null, connect: (x: unknown) => x, start }))
  resume = vi.fn(() => Promise.resolve())
  crearContexto = vi.fn() as unknown as () => void
  class FakeContext {
    state = state
    destination = {}
    resume = resume
    decodeAudioData = vi.fn(async () => ({}))
    createBufferSource = createBufferSource
    createGain = () => ({ gain: { value: 0 }, connect: (x: unknown) => x })
    constructor() {
      crearContexto()
    }
  }
  vi.stubGlobal('AudioContext', FakeContext)
  fetchMock = vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) }))
  vi.stubGlobal('fetch', fetchMock)
}

function pulsar(html: string) {
  document.body.innerHTML = html
  document.body.firstElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

let limpiar: (() => void) | undefined

beforeEach(() => instalarAudio())
afterEach(() => {
  limpiar?.()
  limpiar = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('escucharClics', () => {
  it('al pulsar un botón crea el AudioContext y dispara la fuente', async () => {
    limpiar = (await cargar())()
    pulsar('<button>Ir</button>')
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
    expect(crearContexto).toHaveBeenCalledTimes(1)
    expect(createBufferSource).toHaveBeenCalledTimes(1)
  })

  it('al pulsar un enlace con href suena; sin href no', async () => {
    limpiar = (await cargar())()
    pulsar('<a href="#catalogo">Catálogo</a>')
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
    pulsar('<a>Sin destino</a>')
    await new Promise((r) => setTimeout(r, 10))
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('pulsar el hijo de un botón también suena (closest)', async () => {
    limpiar = (await cargar())()
    pulsar('<button><span>texto</span></button>')
    document.querySelector('span')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => expect(start).toHaveBeenCalled())
  })

  it('el contexto se crea una sola vez y el sonido se descarga una sola vez', async () => {
    limpiar = (await cargar())()
    pulsar('<button>a</button>')
    pulsar('<button>b</button>')
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2))
    expect(crearContexto).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('un contexto suspendido se reanuda al pulsar', async () => {
    instalarAudio('suspended')
    limpiar = (await cargar())()
    pulsar('<button>Ir</button>')
    await vi.waitFor(() => expect(start).toHaveBeenCalled())
    expect(resume).toHaveBeenCalled()
  })

  it.each([
    ['un div normal', '<div>nada</div>'],
    ['un botón con aria-disabled="true"', '<button aria-disabled="true">x</button>'],
    ['un botón disabled', '<button disabled>x</button>'],
    ['un label (evita el doble pop)', '<label>x</label>'],
  ])('no suena al pulsar %s', async (_n, html) => {
    limpiar = (await cargar())()
    pulsar(html)
    await new Promise((r) => setTimeout(r, 10))
    expect(crearContexto).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })

  it('un navegador sin AudioContext no rompe ni propaga el error', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('sin Web Audio')
        }
      },
    )
    limpiar = (await cargar())()
    expect(() => pulsar('<button>Ir</button>')).not.toThrow()
    await new Promise((r) => setTimeout(r, 10))
    expect(start).not.toHaveBeenCalled()
  })

  it('si falla la descarga no rompe y el siguiente clic reintenta', async () => {
    limpiar = (await cargar())()
    fetchMock.mockRejectedValueOnce(new Error('red'))
    pulsar('<button>a</button>')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 10))
    expect(start).not.toHaveBeenCalled()
    pulsar('<button>b</button>')
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('la función de limpieza quita el escuchador', async () => {
    const quitar = (await cargar())()
    quitar()
    pulsar('<button>Ir</button>')
    await new Promise((r) => setTimeout(r, 10))
    expect(crearContexto).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })
})
