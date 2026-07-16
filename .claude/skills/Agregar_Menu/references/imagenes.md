# 🖼️ Imágenes del local (banner + logo + fotos de productos)

Cada local lleva sus imágenes en **`public/locales/<slug>/`** (WebP livianos). Se referencian
por ruta pública en el archivo de datos (`foto`, `logo`, `banner`).

> ⚠️ **Las imágenes SIEMPRE se generan con la skill `/Generar_Imagen` (Pollinations + Flux, gratis).
> NUNCA con Higgsfield ni otro servicio de pago.**

## Qué generar
- **`banner.webp`** — horizontal (`-Orient horizontal`). Hero de la portada. Foto ambiente/comida
  apetitosa del rubro, sin texto. (Si `tema.hero:'logo'`, el banner no se usa.)
- **`logo.webp`** — cuadrado. Emblema limpio y simple del rubro, **sin texto/letras** (Flux escribe
  mal). Se ve como badge de 68px con borde blanco sobre el banner.

> 🎯 **Si el cliente MANDÓ su logo, ÚSALO (no lo inventes).** Y si viene sobre **fondo sólido**
> (típico en logos dramáticos sobre negro), NO lo dejes en cuadro: pásalo por
> **`/Quitar_Fondo_Mejorar_Calidad`** para dejarlo **transparente, nítido y liviano**
> (WebP con alfa, ~50–100 KB) y úsalo con `tema.hero:'logo'` para que **flote** grande en el hero.
> Para logos de líneas metálicas/neón sobre negro, el método de **alfa por luminancia** rinde mejor
> que el flood-fill. **Verifica sobre claro Y oscuro.** Si no, el logo se ve como un "recuadro
> pegado". (Aprendizaje de Pilotos — ver `identidad_y_skin.md` §3.)
- **Una foto por producto destacado / que valga la pena** (cuadradas):
  `foto: '/locales/<slug>/<id>.webp'`.
  - NO hace falta foto para cada opción interna (proteínas/sabores que cambian): esas van con emoji.
  - Para menú del día, la foto va en el **plato armado** (no en cada proteína).

## Cómo generarlas — skill `/Generar_Imagen`
Motor: `C:\Users\Sinfi\.claude\skills\Generar_Imagen\generar.ps1` (Flux vía Pollinations, gratis).
- **Corre SECUENCIAL en primer plano** (en paralelo / `Start-Process` falla). Reintenta solo.
- La cola pública a veces devuelve "parcial" y falla esa imagen: **reintenta esa imagen** (o cambia
  un poco el prompt / el `-Seed`). No pasa a otro servicio.
- Ya entrega **WebP optimizado** (`-Uso web`, lado ≤1280, ~50–150 KB): **no hay que convertir nada**.

```powershell
& "C:\Users\Sinfi\.claude\skills\Generar_Imagen\generar.ps1" `
  -Prompt "TU PROMPT EN INGLES" `
  -Out "C:\...\public\locales\<slug>\<id>" `   # ruta SIN extensión; el script pone .webp
  -Uso web `
  -Orient cuadrada     # cuadrada (platos/logo) | horizontal (banner)
```
Para varias, llama el script **en un bucle secuencial** (una tras otra), no en paralelo.

## De dónde sale el prompt de cada imagen (IMPORTANTE)
`/Generar_Imagen` es texto→imagen (no recibe una foto de referencia), así que **la referencia entra
por el PROMPT**. Decide la base así:

- **Si el menú/cliente TRAE fotos** → básate en ellas. **Lee cada foto real con Read** y descríbela
  fielmente en el prompt: el plato/producto tal cual (ingredientes visibles, emplatado, color,
  porción, vajilla, estilo de foto). La imagen generada debe **parecerse al producto REAL del
  cliente**, no a un genérico. (Sirve también el logo para sacar la paleta/estilo de marca.)
- **Si NO trae fotos** → básate en la **estética que quiere lograr el local**: su rubro + su vibra
  + su paleta (`tema`). Define un estilo y **mantenlo en TODAS las imágenes** para que el menú se
  vea como una sola marca: p. ej. *casero/rústico* (mesa de madera, luz cálida), *gourmet/elegante*
  (plato blanco, fondo oscuro, luz suave), *callejero/vibrante* (colores altos, fondo urbano),
  *café/artesanal*, etc. Que combine con el logo y los colores del local.

## Estilo del prompt (SIEMPRE en inglés, Flux rinde mejor)
Estructura: `"<descripción fiel del plato/objeto>, <estilo elegido>, professional food photography, appetizing, <luz/superficie coherentes>, shallow depth of field, no text"`.
- Reutiliza los MISMOS términos de estilo/luz/superficie en todas las fotos del local (coherencia).
- Ajusta el rubro (postres, café, barbería…). Añade `no text, no letters` al logo.

## Cablear las fotos al archivo de datos (por id, robusto)
Después de generar, pon `foto: '/locales/<slug>/<id>.webp'` en cada producto. Rápido con PowerShell
(ancla por el `id` único del producto; deja intactas las `foto:''` de las opciones):
```powershell
$file = "...\src\dev\<file>.js"
$c = [System.IO.File]::ReadAllText($file)
$map = [ordered]@{ 'prod-simple'='prod-simple'; 'prod-combo'='prod-combo' }  # id => nombreArchivo
foreach ($id in $map.Keys) {
  $c = [regex]::Replace($c, "(?s)(id: '$id'.*?)foto: ''", "`${1}foto: '/locales/<slug>/$($map[$id]).webp'", 1)
}
[System.IO.File]::WriteAllText($file, $c, (New-Object System.Text.UTF8Encoding($false)))
```
El banner y el logo se ponen a mano en `[[CONST]]_LOCAL` (`banner:`, `logo:`).

## Verificar
Lee 1–2 imágenes con Read para confirmar que combinan con el rubro y la paleta. Si una no pega,
**regenérala con `/Generar_Imagen`** (ajusta el prompt). Todas deben pesar poco (WebP) y verse
coherentes con el tema del local.
