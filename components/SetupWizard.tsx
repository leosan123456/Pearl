'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupStep {
  id: number;
  title: string;
  description: string;
}

const steps: SetupStep[] = [
  { id: 1, title: 'Informações Pessoais', description: 'Conte-nos sobre você' },
  { id: 2, title: 'Holding', description: 'Detalhes da sua holding' },
  { id: 3, title: 'Investimentos', description: 'Estratégia de investimento' },
  { id: 4, title: 'Confirmação', description: 'Revisar informações' },
];

interface ProfileData {
  name: string;
  jobTitle: string;
  phone: string;
  bio: string;
  holdingName: string;
  mainSector: string;
  mainSubSector: string;
  companiesCount: number;
  country: string;
  investmentStage: string;
  fundSize: number;
  focusSectors: string;
}

export default function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    jobTitle: '',
    phone: '',
    bio: '',
    holdingName: '',
    mainSector: '',
    mainSubSector: '',
    companiesCount: 0,
    country: '',
    investmentStage: '',
    fundSize: 0,
    focusSectors: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'companiesCount' || name === 'fundSize' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar perfil');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step.id}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-slate-400">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg p-8 mb-8 border border-slate-700">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}

          {/* Step 1: Informações Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="Ex: CEO, Partner, Manager"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+55 (11) 98765-4321"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bioografia
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Conte um pouco sobre você"
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Holding */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Holding
                </label>
                <input
                  type="text"
                  name="holdingName"
                  value={formData.holdingName}
                  onChange={handleInputChange}
                  placeholder="Sua holding"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Setor Principal
                </label>
                <select
                  name="mainSector"
                  value={formData.mainSector}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione um setor</option>
                  <option value="technology">Tecnologia</option>
                  <option value="finance">Finanças</option>
                  <option value="healthcare">Saúde</option>
                  <option value="retail">Varejo</option>
                  <option value="energy">Energia</option>
                  <option value="real-estate">Imóveis</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sub-setor
                </label>
                <input
                  type="text"
                  name="mainSubSector"
                  value={formData.mainSubSector}
                  onChange={handleInputChange}
                  placeholder="Ex: SaaS, Fintech, Biotech"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  País
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Brasil"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número de Empresas
                </label>
                <input
                  type="number"
                  name="companiesCount"
                  value={formData.companiesCount}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Investimentos */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Estágio de Investimento
                </label>
                <select
                  name="investmentStage"
                  value={formData.investmentStage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione um estágio</option>
                  <option value="seed">Seed</option>
                  <option value="early">Early Stage</option>
                  <option value="growth">Growth</option>
                  <option value="mature">Maduro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tamanho do Fundo (USD)
                </label>
                <input
                  type="number"
                  name="fundSize"
                  value={formData.fundSize}
                  onChange={handleInputChange}
                  min="0"
                  step="100000"
                  placeholder="1000000"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Setores de Foco
                </label>
                <textarea
                  name="focusSectors"
                  value={formData.focusSectors}
                  onChange={handleInputChange}
                  placeholder="Separe por vírgula: Tech, Saúde, Energia"
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-6">
                Revisar Informações
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Nome</p>
                  <p className="text-white font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cargo</p>
                  <p className="text-white font-medium">{formData.jobTitle}</p>
                </div>
                <div>
                  <p className="text-slate-400">Holding</p>
                  <p className="text-white font-medium">{formData.holdingName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Setor</p>
                  <p className="text-white font-medium">{formData.mainSector}</p>
                </div>
                <div>
                  <p className="text-slate-400">País</p>
                  <p className="text-white font-medium">{formData.country}</p>
                </div>
                <div>
                  <p className="text-slate-400">Empresas</p>
                  <p className="text-white font-medium">{formData.companiesCount}</p>
                </div>
                <div>
                  <p className="text-slate-400">Estágio</p>
                  <p className="text-white font-medium">{formData.investmentStage}</p>
                </div>
                <div>
                  <p className="text-slate-400">Fundo</p>
                  <p className="text-white font-medium">
                    ${(formData.fundSize / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6 py-2 rounded bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
          >
            Anterior
          </button>

          <div className="flex-1" />

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 rounded bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition"
            >
              {isLoading ? 'Salvando...' : 'Concluir Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
