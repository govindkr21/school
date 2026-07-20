import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Search, School as SchoolIcon, ArrowRight, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react'
import { apiGet } from '../lib/api'
import { STATES_DISTRICTS } from '../lib/states'

const heading = { fontFamily: "'Vesper Libre', serif" }

const FindSchool: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<any[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  // Selection State
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<any>(null)

  // Search/Dropdown UI State
  const [stateSearch, setStateSearch] = useState('')
  const [districtSearch, setDistrictSearch] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')

  const [showStateList, setShowStateList] = useState(false)
  const [showDistrictList, setShowDistrictList] = useState(false)
  const [showSchoolList, setShowSchoolList] = useState(false)

  // Refs for outside click
  const stateRef = useRef<HTMLDivElement>(null)
  const districtRef = useRef<HTMLDivElement>(null)
  const schoolRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(event.target as Node)) setShowStateList(false)
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) setShowDistrictList(false)
      if (schoolRef.current && !schoolRef.current.contains(event.target as Node)) setShowSchoolList(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedState && selectedDistrict) {
      fetchSchools()
    } else {
      setSchools([])
    }
  }, [selectedState, selectedDistrict])

  const fetchSchools = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const params = new URLSearchParams()
      params.append('state', selectedState)
      params.append('district', selectedDistrict)
      const urlPath = `/students/schools/search?${params.toString()}`

      const res = await apiGet(urlPath)

      if (res.success && Array.isArray(res.data)) {
        setSchools(res.data)
        if (res.data.length > 0) setShowSchoolList(true)
      } else {
        setApiError('Invalid API response')
        setSchools([])
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch schools')
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (selectedSchool) {
      navigate('/verify', { state: { school: selectedSchool } })
    }
  }

  const allStates = Object.keys(STATES_DISTRICTS)
  const filteredStates = allStates.filter(s =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const allDistricts: string[] = selectedState
    ? (STATES_DISTRICTS as any)[selectedState] || []
    : []
  const filteredDistricts = allDistricts.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  )

  const filteredSchools = schools.filter(s =>
    s.name?.toLowerCase().includes(schoolSearch.toLowerCase())
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF8F0] p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#134430]">
            <MapPin className="h-7 w-7 text-[#FBF8F0]" />
          </div>
          <h1 className="text-3xl" style={heading}>Find your school</h1>
          <p className="mt-2 text-[16px] text-[#5C6B62]">Select your state, district and school to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#EAE1CC] bg-white p-5 sm:p-8">
          <div className="flex flex-col gap-6">

            {/* State Selection */}
            <div className="relative" ref={stateRef}>
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Select state</label>
              <div
                className={`flex cursor-text items-center gap-3 rounded-[10px] border p-4 transition-all ${showStateList ? 'border-[#1B5E3F] bg-white' : 'border-[#DED2B6] bg-[#FBF8F0] hover:border-[#1B5E3F]/50'}`}
                onClick={() => setShowStateList(true)}
              >
                <MapPin className={`h-5 w-5 ${selectedState ? 'text-[#1B5E3F]' : 'text-[#8B978F]'}`} />
                <input
                  type="text"
                  value={stateSearch || selectedState}
                  onChange={(e) => {
                    setStateSearch(e.target.value)
                    setShowStateList(true)
                  }}
                  placeholder="Search your state..."
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none placeholder:text-[#8B978F]"
                />
                <ChevronDown className={`h-4 w-4 text-[#8B978F] transition-transform ${showStateList ? 'rotate-180' : ''}`} />
              </div>

              {showStateList && (
                <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto overflow-hidden rounded-[10px] border border-[#EAE1CC] bg-white shadow-xl">
                  <div className="sticky top-0 border-b border-[#EAE1CC] bg-[#FBF8F0] p-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
                    All states ({filteredStates.length})
                  </div>
                  {filteredStates.length > 0 ? (
                    filteredStates.map(s => (
                      <button
                        key={s}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedState(s)
                          setStateSearch('')
                          setShowStateList(false)
                          setSelectedDistrict('')
                          setSelectedSchool(null)
                        }}
                        className="flex w-full items-center justify-between border-b border-[#EAE1CC] p-3 text-left text-sm font-medium text-[#14231B] last:border-none hover:bg-[#FBF8F0]"
                      >
                        {s}
                        {selectedState === s && <CheckCircle2 className="h-4 w-4 text-[#1B5E3F]" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-[#8B978F]">No states found</div>
                  )}
                </div>
              )}
            </div>

            {/* District Selection */}
            <div
              className={`relative transition-all ${!selectedState ? 'pointer-events-none opacity-40' : 'opacity-100'}`}
              ref={districtRef}
            >
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Select district</label>
              <div
                className={`flex cursor-text items-center gap-3 rounded-[10px] border p-4 transition-all ${showDistrictList ? 'border-[#1B5E3F] bg-white' : 'border-[#DED2B6] bg-[#FBF8F0] hover:border-[#1B5E3F]/50'}`}
                onClick={() => setShowDistrictList(true)}
              >
                <Search className={`h-5 w-5 ${selectedDistrict ? 'text-[#1B5E3F]' : 'text-[#8B978F]'}`} />
                <input
                  type="text"
                  value={districtSearch || selectedDistrict}
                  onChange={(e) => {
                    setDistrictSearch(e.target.value)
                    setShowDistrictList(true)
                  }}
                  placeholder={selectedState ? 'Search district...' : 'Select state first'}
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none placeholder:text-[#8B978F]"
                  disabled={!selectedState}
                />
                <ChevronDown className={`h-4 w-4 text-[#8B978F] transition-transform ${showDistrictList ? 'rotate-180' : ''}`} />
              </div>

              {showDistrictList && (
                <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto overflow-hidden rounded-[10px] border border-[#EAE1CC] bg-white shadow-xl">
                  <div className="sticky top-0 border-b border-[#EAE1CC] bg-[#FBF8F0] p-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
                    Districts in {selectedState}
                  </div>
                  {filteredDistricts.length > 0 ? (
                    filteredDistricts.map(d => (
                      <button
                        key={d}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDistrict(d)
                          setDistrictSearch('')
                          setShowDistrictList(false)
                          setSelectedSchool(null)
                        }}
                        className="flex w-full items-center justify-between border-b border-[#EAE1CC] p-3 text-left text-sm font-medium text-[#14231B] last:border-none hover:bg-[#FBF8F0]"
                      >
                        {d}
                        {selectedDistrict === d && <CheckCircle2 className="h-4 w-4 text-[#1B5E3F]" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-[#8B978F]">No districts found</div>
                  )}
                </div>
              )}
            </div>

            {/* School Selection */}
            <div
              className={`relative transition-all ${!selectedDistrict ? 'pointer-events-none opacity-40' : 'opacity-100'}`}
              ref={schoolRef}
            >
              <label className="mb-2 block font-mono text-xs text-[#5C6B62]">Search and select school</label>
              <div
                className={`flex cursor-text items-center gap-3 rounded-[10px] border p-4 transition-all ${showSchoolList ? 'border-[#1B5E3F] bg-white' : 'border-[#DED2B6] bg-[#FBF8F0] hover:border-[#1B5E3F]/50'}`}
              >
                <SchoolIcon className={`h-5 w-5 ${selectedSchool ? 'text-[#1B5E3F]' : 'text-[#8B978F]'}`} />
                <input
                  type="text"
                  onFocus={() => setShowSchoolList(true)}
                  value={schoolSearch || (selectedSchool ? selectedSchool.name : '')}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value)
                    if (selectedSchool) setSelectedSchool(null)
                    setShowSchoolList(true)
                  }}
                  placeholder={selectedDistrict ? 'Type school name...' : 'Select district first'}
                  className="flex-1 bg-transparent text-[16px] text-[#14231B] outline-none placeholder:text-[#8B978F]"
                  disabled={!selectedDistrict}
                />
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#1B5E3F]" />
                ) : (
                  <ChevronDown
                    className={`h-4 w-4 text-[#8B978F] transition-transform ${showSchoolList ? 'rotate-180' : ''}`}
                    onClick={() => setShowSchoolList(v => !v)}
                  />
                )}
              </div>

              {showSchoolList && (
                <div className="relative z-[100] mt-2 w-full overflow-hidden rounded-[10px] border border-[#EAE1CC] bg-white shadow-xl">
                  <div className="sticky top-0 border-b border-[#EAE1CC] bg-[#FBF8F0] p-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
                    Select school ({filteredSchools.length} found)
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((s) => (
                        <button
                          key={s.schoolId}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSchool(s)
                            setSchoolSearch('')
                            setShowSchoolList(false)
                          }}
                          className="w-full border-b border-[#EAE1CC] p-4 text-left last:border-none hover:bg-[#FBF8F0]"
                        >
                          <div className="text-sm font-medium text-[#14231B]">{s.name}</div>
                          <div className="mt-1 font-mono text-[12px] text-[#8B978F]">
                            ID: {s.schoolId} · {s.district}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF8F0]">
                          <Search className="h-5 w-5 text-[#8B978F]" />
                        </div>
                        <div className="text-sm font-medium text-[#5C6B62]">No schools registered here</div>
                        <div className="mt-1 text-xs text-[#8B978F]">Is your school missing? Visit your admin office.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* API Error */}
            {apiError && (
              <div className="rounded-[10px] border border-[#F8E8E5] bg-[#F8E8E5] px-4 py-3 text-sm text-[#A63A2E]">
                {apiError}
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedSchool}
              className="group flex w-full items-center justify-center gap-3 rounded-[10px] bg-[#1B5E3F] py-4 text-[16px] font-medium text-[#FBF8F0] transition hover:bg-[#134430] disabled:cursor-not-allowed disabled:bg-[#EAE1CC] disabled:text-[#8B978F]"
            >
              Continue to verification
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center font-mono text-[12px] uppercase tracking-[0.14em] text-[#8B978F]">
          Madnir student portal
        </p>
        <p className="mt-3 text-center text-sm">
          <Link to="/track" className="font-medium text-[#1B5E3F] hover:text-[#134430]">Already have a complaint ID? Track it here</Link>
        </p>

      </div>
    </div>
  )
}

export default FindSchool
