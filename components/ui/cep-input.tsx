import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface CEPInputProps {
  initialValue?: string
  onAddressFound?: (address: {
    street: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }) => void
  disabled?: boolean
}

export function CEPInput({ initialValue = "", onAddressFound, disabled = false }: CEPInputProps) {
  const [cep, setCep] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Format CEP as user types
  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2").substring(0, 9)
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setCep(formatted)
  }

  const searchAddress = async () => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setError("CEP inválido")
      return
    }

    setLoading(true)
    setError("")

    try {
      // In a real implementation, you would call an actual CEP API
      // For demo purposes, we'll simulate a successful response
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`)
      
      if (!response.ok) {
        throw new Error("Erro ao buscar CEP")
      }

      const data = await response.json()

      if (data.erro) {
        setError("CEP não encontrado")
        return
      }

      // Call the callback with the address data
      onAddressFound?.({
        street: `${data.logradouro}`,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: cep,
      })
    } catch (err) {
      console.error("Error fetching address:", err)
      setError("Erro ao buscar endereço")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchAddress()
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="cep">CEP</Label>
      <div className="flex gap-2">
        <Input
          id="cep"
          value={cep}
          onChange={handleCEPChange}
          onKeyPress={handleKeyPress}
          placeholder="00000-000"
          disabled={disabled}
          className={error ? "border-red-500" : ""}
        />
        <button
          onClick={searchAddress}
          disabled={disabled || loading || cep.replace(/\D/g, "").length !== 8}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}