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

interface ProductDifference {
  product: Product
  changeType: "new" | "price-change"
  oldPrice?: string
}

export default function PriceLabelGenerator() {
  const [input, setInput] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [color, setColor] = useState("#E47C00")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [isProductsExpanded, setIsProductsExpanded] = useState(false)

  const [labelWidth, setLabelWidth] = useState(6)
  const [labelHeight, setLabelHeight] = useState(3.5)
  const [priceFontSize, setPriceFontSize] = useState(3)
  const [nameFontSize, setNameFontSize] = useState(0.9)

  const [showOriginalPrice, setShowOriginalPrice] = useState(false)
  const [strikethroughOriginalPrice, setStrikethroughOriginalPrice] = useState(true)
  const [originalPriceFontSize, setOriginalPriceFontSize] = useState(0.9)
  const [originalPriceSpacing, setOriginalPriceSpacing] = useState(0)

  const [printOnlyDiscounted, setPrintOnlyDiscounted] = useState(false)

  const [mode, setMode] = useState<"normal" | "differences">("normal")
  const [oldListInput, setOldListInput] = useState("")
  const [newListInput, setNewListInput] = useState("")
  const [differences, setDifferences] = useState<ProductDifference[]>([])

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

    return parsed
  }

  const compareLists = () => {
    const oldProducts = parseProducts(oldListInput)
    const newProducts = parseProducts(newListInput)

    const oldProductsMap = new Map<string, Product>()
    oldProducts.forEach((product) => {
      oldProductsMap.set(product.code, product)
    })

    const foundDifferences: ProductDifference[] = []

    newProducts.forEach((newProduct) => {
      const oldProduct = oldProductsMap.get(newProduct.code)

      if (!oldProduct) {
        foundDifferences.push({
          product: newProduct,
          changeType: "new",
        })
      } else if (oldProduct.price !== newProduct.price) {
        foundDifferences.push({
          product: newProduct,
          changeType: "price-change",
          oldPrice: oldProduct.price,
        })
      }
    })

    setDifferences(foundDifferences)
    setProducts(foundDifferences.map((d) => d.product))
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

  const printFilteredProducts = useMemo(() => {
    return filteredProducts.filter(({ product }) => {
      if (!printOnlyDiscounted) return true
      return product.discount !== undefined && product.discount > 0
    })
  }, [filteredProducts, printOnlyDiscounted])

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

  const resetAll = () => {
    setInput("")
    setProducts([])
    setSelectedProducts(new Set())
    setSearchTerm("")
    setIsProductsExpanded(false)
    setOldListInput("")
    setNewListInput("")
    setDifferences([])
    setMode("normal")
  }

  const handleGenerate = () => {
    const parsed = parseProducts(input)
    setProducts(parsed)
    setSelectedProducts(new Set())
    setSearchTerm("")
  }

  const handlePrint = () => {
    window.print()
  }

  const productsWithDiscount = products.filter((p) => p.discount).length

  const removeDiscountFromSelected = () => {
    const updatedProducts = products.map((product, index) => {
      if (selectedProducts.has(index) && product.discount) {
        return {
          code: product.code,
          name: product.name,
          price: product.originalPrice || product.price,
        }
      }
      return product
    })
    setProducts(updatedProducts)
    setSelectedProducts(new Set())
  }

  const deleteSelectedProducts = () => {
    const updatedProducts = products.filter((_, index) => !selectedProducts.has(index))
    setProducts(updatedProducts)
    setSelectedProducts(new Set())

    // If in differences mode, also update the differences array
    if (mode === "differences") {
      const updatedDifferences = differences.filter((diff) => {
        const productIndex = products.findIndex((p) => p.code === diff.product.code)
        return !selectedProducts.has(productIndex)
      })
      setDifferences(updatedDifferences)
    }
  }

  const getDifferenceInfo = (productCode: string): ProductDifference | undefined => {
    return differences.find((d) => d.product.code === productCode)
  }

  const exportToExcel = () => {
    const exportText = products
      .map((product) => {
        const paddedCode = product.code.padEnd(20, " ")
        const paddedName = product.name.padEnd(45, " ")
        const priceWithDecimals = `${product.price},00`
        return `${paddedCode}${paddedName}${priceWithDecimals}`
      })
      .join("\n")

    navigator.clipboard.writeText(exportText).then(() => {
      alert("Lista copiada al portapapeles! Ahora puedes pegarla en Excel o en 'Lista Antigua'")
    })
  }

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

        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setMode("normal")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              mode === "normal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Modo Normal
          </button>
          <button
            onClick={() => setMode("differences")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              mode === "differences"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Ver Diferencias
          </button>
        </div>

        <div className="space-y-8">
          {mode === "normal" ? (
            <>
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
                      onClick={exportToExcel}
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H7c-1 0-2-1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Exportar Lista
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
            </>
          ) : (
            <>
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
                    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                  Comparar Listas
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Compara dos listas para encontrar productos nuevos o con cambios de precio. Solo se generarán
                  etiquetas para los productos que cambiaron.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Lista Antigua (semana pasada)</label>
                    <Textarea
                      value={oldListInput}
                      onChange={(e) => setOldListInput(e.target.value)}
                      placeholder="Pega la lista antigua aquí..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Lista Nueva (esta semana)</label>
                    <Textarea
                      value={newListInput}
                      onChange={(e) => setNewListInput(e.target.value)}
                      placeholder="Pega la lista nueva aquí..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Differences Mode */}
              <div className="flex gap-3 flex-wrap">
                <Button onClick={compareLists} size="lg" className="flex items-center gap-2">
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
                    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                  Comparar y Generar
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
                      onClick={exportToExcel}
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Exportar Lista
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

              {differences.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
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
                    Resumen de Diferencias
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Total de cambios</div>
                      <div className="text-2xl font-bold text-blue-600">{differences.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Productos nuevos</div>
                      <div className="text-2xl font-bold text-green-600">
                        {differences.filter((d) => d.changeType === "new").length}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Cambios de precio</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {differences.filter((d) => d.changeType === "price-change").length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

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
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0-.73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0-2.73.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Configuración
            </h2>
            <div className="space-y-6">
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

              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-4">Dimensiones de las etiquetas:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">Ancho (cm)</label>
                    <Input
                      type="number"
                      value={labelWidth}
                      onChange={(e) => setLabelWidth(Number(e.target.value))}
                      min="1"
                      max="20"
                      step="0.1"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">Alto (cm)</label>
                    <Input
                      type="number"
                      value={labelHeight}
                      onChange={(e) => setLabelHeight(Number(e.target.value))}
                      min="1"
                      max="20"
                      step="0.1"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">Tamaño precio (rem)</label>
                    <Input
                      type="number"
                      value={priceFontSize}
                      onChange={(e) => setPriceFontSize(Number(e.target.value))}
                      min="0.5"
                      max="5"
                      step="0.1"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">Tamaño nombre (rem)</label>
                    <Input
                      type="number"
                      value={nameFontSize}
                      onChange={(e) => setNameFontSize(Number(e.target.value))}
                      min="0.1"
                      max="2"
                      step="0.05"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {mode === "normal" && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium mb-3">Opciones de Ofertas:</label>
                  <div className="flex items-center gap-3 mb-3">
                    <Checkbox
                      id="show-original-price"
                      checked={showOriginalPrice}
                      onCheckedChange={(checked) => setShowOriginalPrice(checked as boolean)}
                    />
                    <label htmlFor="show-original-price" className="text-sm cursor-pointer">
                      Mostrar precio original en productos con descuento
                    </label>
                  </div>

                  {showOriginalPrice && (
                    <div className="ml-6 pl-4 border-l-2 border-muted space-y-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="strikethrough-original"
                          checked={strikethroughOriginalPrice}
                          onCheckedChange={(checked) => setStrikethroughOriginalPrice(checked as boolean)}
                        />
                        <label htmlFor="strikethrough-original" className="text-sm cursor-pointer">
                          Tachar precio original
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-2">
                            Tamaño precio original (rem)
                          </label>
                          <Input
                            type="number"
                            value={originalPriceFontSize}
                            onChange={(e) => setOriginalPriceFontSize(Number(e.target.value))}
                            min="0.3"
                            max="2"
                            step="0.1"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-2">Espaciado inferior (rem)</label>
                          <Input
                            type="number"
                            value={originalPriceSpacing}
                            onChange={(e) => setOriginalPriceSpacing(Number(e.target.value))}
                            min="0"
                            max="1"
                            step="0.05"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    Cuando está activado, las etiquetas con descuento mostrarán el precio original arriba del precio con
                    descuento
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-3">Opciones de Impresión:</label>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="print-only-discounted"
                    checked={printOnlyDiscounted}
                    onCheckedChange={(checked) => setPrintOnlyDiscounted(checked as boolean)}
                  />
                  <label htmlFor="print-only-discounted" className="text-sm cursor-pointer">
                    Imprimir solo productos con descuento
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cuando está activado, solo se imprimirán las etiquetas de productos que tengan descuentos aplicados
                </p>
              </div>
            </div>
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
                  <Button onClick={removeDiscountFromSelected} variant="outline" size="lg">
                    Quitar Descuento
                  </Button>
                  <Button
                    onClick={deleteSelectedProducts}
                    variant="destructive"
                    size="lg"
                    className="flex items-center gap-2"
                  >
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                    Eliminar Seleccionados
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
        {products.length === 0 && input === "" && mode === "normal" && (
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
          <div className="grid grid-cols-3 gap-x-0 gap-y-3 p-4">
            {printFilteredProducts.map(({ product, index }) => {
              const diffInfo = getDifferenceInfo(product.code)
              return (
                <div
                  key={index}
                  className="relative border-2 flex flex-col"
                  style={{
                    width: `${labelWidth}cm`,
                    height: `${labelHeight}cm`,
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

                  {mode === "differences" && diffInfo && (
                    <div
                      className="text-xs font-bold absolute top-1 right-2 px-1 rounded"
                      style={{
                        backgroundColor: diffInfo.changeType === "new" ? "#10b981" : "#f59e0b",
                        color: "#fff",
                      }}
                    >
                      {diffInfo.changeType === "new" ? "NUEVO" : "PRECIO"}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col items-center justify-center">
                    {showOriginalPrice && product.discount && product.originalPrice && (
                      <div
                        className={`text-center mb-1 ${strikethroughOriginalPrice ? "line-through" : ""}`}
                        style={{
                          color: "#9ca3af",
                          fontSize: `${originalPriceFontSize}rem`,
                          marginBottom: `${originalPriceSpacing}rem`,
                        }}
                      >
                        ${product.originalPrice}
                      </div>
                    )}
                    <div
                      className="font-bold text-center leading-none"
                      style={{
                        color,
                        fontSize: `${priceFontSize}rem`,
                      }}
                    >
                      ${product.price}
                    </div>
                  </div>

                  <div
                    className="text-center font-medium uppercase"
                    style={{
                      fontSize: `${nameFontSize}rem`,
                      lineHeight: "1.1",
                      color: "#000",
                    }}
                  >
                    {product.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )}

  