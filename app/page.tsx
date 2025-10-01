"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface Product {
  code: string
  name: string
  price: string
  originalPrice?: string
  discount?: number
}

export default function PriceLabelGenerator() {
  const [input, setInput] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [color, setColor] = useState("#E47C00")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [isProductsExpanded, setIsProductsExpanded] = useState(false)

  const parseProducts = (text: string) => {
    const lines = text.trim().split("\n")
    const parsed: Product[] = []

    lines.forEach((line) => {
      const trimmedLine = line.trim()

      if (!trimmedLine) return

      const match = trimmedLine.match(/^(\d+)\s+(.+?)\s+([\d.,]+)$/)

      if (match) {
        const code = match[1]
        const name = match[2].trim()
        const priceStr = match[3]

        const price = priceStr.replace(/,00$/, "")

        parsed.push({ code, name, price })
      }
    })

    setProducts(parsed)
    setSelectedProducts(new Set())
    setSearchTerm("")
  }

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return products
      .map((product, index) => ({ product, index }))
      .filter(({ product }) => {
        if (!search) return true
        return product.name.toLowerCase().includes(search) || product.code.includes(search)
      })
  }, [products, searchTerm])

  const toggleProductSelection = (index: number) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedProducts(newSelected)
  }

  const selectAll = () => {
    const allIndices = new Set(filteredProducts.map(({ index }) => index))
    setSelectedProducts(allIndices)
  }

  const deselectAll = () => {
    setSelectedProducts(new Set())
  }

  const applyDiscount = (discountPercent: number) => {
    const updatedProducts = products.map((product, index) => {
      if (selectedProducts.has(index)) {
        const originalPrice = product.originalPrice || product.price
        const numericPrice = Number.parseFloat(originalPrice.replace(/\./g, "").replace(",", "."))
        const discountedPrice = numericPrice * (1 - discountPercent / 100)
        const formattedPrice = Math.round(discountedPrice)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")

        return {
          ...product,
          price: formattedPrice,
          originalPrice,
          discount: discountPercent,
        }
      }
      return product
    })

    setProducts(updatedProducts)
    setSelectedProducts(new Set())
  }

  const clearDiscounts = () => {
    const updatedProducts = products.map((product) => ({
      code: product.code,
      name: product.name,
      price: product.originalPrice || product.price,
    }))
    setProducts(updatedProducts)
    setSelectedProducts(new Set())
  }

  const resetAll = () => {
    setInput("")
    setProducts([])
    setSelectedProducts(new Set())
    setSearchTerm("")
    setIsProductsExpanded(false)
  }

  const handleGenerate = () => {
    parseProducts(input)
  }

  const handlePrint = () => {
    window.print()
  }

  const productsWithDiscount = products.filter((p) => p.discount).length

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden border-b">
        <a
          href="https://alfonsa-tools-modern.vercel.app/"
          className="inline-flex items-center gap-2 p-4 hover:bg-muted transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span className="text-sm font-medium">Volver al inicio</span>
        </a>
      </div>

      <div className="container mx-auto p-8 print:hidden max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Generador de Etiquetas de Precios</h1>
          <p className="text-muted-foreground">Crea etiquetas profesionales para tu negocio</p>
        </div>

        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Datos de Productos
            </h2>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pega tu lista aquí. Ejemplo:&#10;22              AMARGO OBRERO 750CC                      4.500,00&#10;26              AMERICANO  GANCIA 950CC                  6.500,00"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Settings Section */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0-2.73.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Configuración
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Color de las etiquetas:</label>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setColor("#E47C00")}
                    variant={color === "#E47C00" ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#E47C00] border-2 border-white shadow-sm" />
                    Naranja
                  </Button>
                  <Button
                    onClick={() => setColor("#000000")}
                    variant={color === "#000000" ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-sm" />
                    Negro
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleGenerate} size="lg" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Generar Etiquetas
            </Button>
            {products.length > 0 && (
              <>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                    <rect x="6" y="14" width="12" height="8" rx="1" />
                  </svg>
                  Imprimir
                </Button>
                <Button
                  onClick={resetAll}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Limpiar Todo
                </Button>
              </>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <>
            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Total de productos</div>
                <div className="text-2xl font-bold">{products.length}</div>
              </div>
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Productos en oferta</div>
                <div className="text-2xl font-bold text-green-600">{productsWithDiscount}</div>
              </div>
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-muted-foreground mb-1">Productos seleccionados</div>
                <div className="text-2xl font-bold text-blue-600">{selectedProducts.size}</div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mt-8 bg-card border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Buscar y Seleccionar
              </h2>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por nombre o código del producto..."
                className="mb-4"
              />
              {searchTerm && (
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredProducts.length} de {products.length} productos
                </p>
              )}
            </div>

            {/* Offers Section */}
            {selectedProducts.size > 0 && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Aplicar Descuentos
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedProducts.size} producto{selectedProducts.size !== 1 ? "s" : ""} seleccionado
                  {selectedProducts.size !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => applyDiscount(10)}
                    variant="default"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    -10% Descuento
                  </Button>
                  <Button
                    onClick={() => applyDiscount(15)}
                    variant="default"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    -15% Descuento
                  </Button>
                  <Button
                    onClick={() => applyDiscount(20)}
                    variant="default"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    -20% Descuento
                  </Button>
                  <Button onClick={clearDiscounts} variant="outline" size="lg">
                    Resetear Descuentos
                  </Button>
                </div>
              </div>
            )}

            {/* Collapsible Section */}
            <div className="mt-6">
              <div className="flex gap-2 mb-2">
                <Button
                  onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                  variant="outline"
                  className="flex-1 justify-between"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3h18v18H3zM9 9h6v6H9z" />
                    </svg>
                    Productos disponibles ({filteredProducts.length})
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isProductsExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </Button>
                {isProductsExpanded && (
                  <>
                    <Button onClick={selectAll} variant="outline" size="default">
                      Seleccionar Todo
                    </Button>
                    <Button onClick={deselectAll} variant="outline" size="default">
                      Deseleccionar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isProductsExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredProducts.map(({ product, index }) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedProducts.has(index)
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                        : "bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => toggleProductSelection(index)}
                  >
                    <Checkbox
                      checked={selectedProducts.has(index)}
                      onCheckedChange={() => toggleProductSelection(index)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-1">
                        <span className="text-muted-foreground">#{product.code}</span> {product.name}
                      </div>
                      <div className="text-sm">
                        {product.discount && product.originalPrice && (
                          <span className="line-through text-muted-foreground mr-2">$ {product.originalPrice}</span>
                        )}
                        <span className={`font-bold ${product.discount ? "text-green-600" : ""}`}>
                          $ {product.price}
                        </span>
                        {product.discount && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {products.length === 0 && input === "" && (
          <div className="mt-12 text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-muted-foreground"
            >
              <path d="M3 3h18v18H3zM9 9h6v6H9z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">Comienza a crear tus etiquetas</h3>
            <p className="text-muted-foreground">Pega tu lista de productos arriba y haz clic en "Generar Etiquetas"</p>
          </div>
        )}
      </div>

    {products.length > 0 && (
        <div className="print:block">
          <div className="grid grid-cols-3 gap-0 p-4">
            {products.map((product, index) => (
              <div
                key={index}
                className="relative border-2 flex flex-col"
                style={{
                  width: "6cm",
                  height: "3cm", // ← manejar alto de caja
                  borderColor: color,
                  padding: "0.3cm",
                  pageBreakInside: "avoid",
                }}
              >
                <div className="text-xs font-medium absolute top-1 left-2" style={{ color }}>
                  {product.code}
                </div>
                {product.discount && (
                  <div
                    className="text-xs font-bold absolute top-1 right-2 px-1 rounded"
                    style={{
                      backgroundColor: color,
                      color: "#fff",
                    }}
                  >
                    -{product.discount}%
                  </div>
                )}
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="font-bold text-center leading-none"
                    style={{
                      color,
                      fontSize: "3rem", // ← más grande el precio
                      lineHeight: 1,        // ← evita que “salte”
                      whiteSpace: "nowrap", // ← evita que se parta en dos líneas
                    }}
                  >
                    ${product.price}
                  </div>
                </div>

                <div
                  className="text-center font-medium uppercase"
                  style={{
                    fontSize: "0.9rem", // ← tamaño del nombre del producto”
                    lineHeight: "1.1",
                    color: "#000",
                  }}
                >
                  {product.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
