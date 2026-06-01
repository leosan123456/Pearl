'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface CompanyLogoUploadProps {
  companyId: string;
  currentLogo?: string | null;
  onUploadComplete?: (logoUrl: string) => void;
}

export default function CompanyLogoUpload({
  companyId,
  currentLogo,
  onUploadComplete,
}: CompanyLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Fazer upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const response = await fetch('/api/upload/company-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      setPreview(data.logo);
      onUploadComplete?.(data.logo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPreview(currentLogo || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploading(true);
      // Se houver um endpoint para remover, chamar aqui
      // Por enquanto, apenas limpar o preview
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Logo da Empresa</h3>
        {preview && (
          <button
            onClick={handleRemoveLogo}
            disabled={uploading}
            className="text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {preview ? (
        <div className="relative w-full h-48 bg-slate-700 rounded-lg border border-slate-600 overflow-hidden flex items-center justify-center">
          <Image
            src={preview}
            alt="Logo preview"
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 transition cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <Upload size={32} className="text-slate-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">Clique para fazer upload</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF (máx 5MB)</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {uploading && (
        <div className="text-center text-sm text-slate-400">
          Fazendo upload...
        </div>
      )}
    </div>
  );
}
