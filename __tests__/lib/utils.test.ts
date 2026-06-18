import { describe, it, expect } from "vitest"
import { cn } from "../../lib/utils"

describe("cn utility function", () => {
  it("should return empty string if no arguments are provided", () => {
    expect(cn()).toBe("")
  })

  it("should merge standard tailwind classes", () => {
    expect(cn("px-2 py-1 bg-red-500 hover:bg-red-600")).toBe("px-2 py-1 bg-red-500 hover:bg-red-600")
    expect(cn("px-2", "py-1", "bg-red-500", "hover:bg-red-600")).toBe("px-2 py-1 bg-red-500 hover:bg-red-600")
  })

  it("should resolve conditional classes", () => {
    const isError = true
    expect(cn("p-4", isError && "bg-red-500")).toBe("p-4 bg-red-500")
    expect(cn("p-4", !isError && "bg-red-500")).toBe("p-4")
    expect(cn("p-4", { "bg-red-500": isError })).toBe("p-4 bg-red-500")
    expect(cn("p-4", { "bg-red-500": !isError })).toBe("p-4")
  })

  it("should remove conflicting tailwind classes correctly via tailwind-merge", () => {
    expect(cn("px-2 py-1 bg-red-500", "p-3 bg-[#B91C1C]")).toBe("p-3 bg-[#B91C1C]")
    expect(cn("text-sm text-gray-500", "text-lg", "text-black")).toBe("text-lg text-black")
  })

  it("should handle arrays of classes", () => {
    expect(cn(["p-4", "m-2"], ["text-sm", "font-bold"])).toBe("p-4 m-2 text-sm font-bold")
    expect(cn(["p-4", "m-2"], "bg-white", { "text-black": true })).toBe("p-4 m-2 bg-white text-black")
  })

  it("should handle undefined, null, and false gracefully", () => {
    expect(cn("p-4", undefined, null, false, "m-2")).toBe("p-4 m-2")
    expect(cn(undefined)).toBe("")
    expect(cn(null)).toBe("")
  })
})
