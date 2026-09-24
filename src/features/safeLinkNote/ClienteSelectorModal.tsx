import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Building2, User, Home, Check } from 'lucide-react';
import { particularService } from '@/services/particularService';
import { adminService } from '@/services/adminService';
import { consorcioService } from '@/services/consorcioService';
import styles from './NuevoRelevamiento.module.css';

export type ClienteItem = {
  id: string;
  nombre: string;
  direccion: string;
  contacto: string;
  tipo: 'particular' | 'administracion' | 'consorcio';
  tipoLabel: string;
};

interface ClienteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: ClienteItem) => void;
  onOpenCreate: () => void;
  selectedId?: string | null;
}

export const ClienteSelectorModal: React.FC<ClienteSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onOpenCreate,
  selectedId,
}) => {
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<ClienteItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);

    const loadAll = async () => {
      try {
        const [particulares, administraciones, consorcios] = await Promise.all([
          particularService.getAll().catch(() => []),
          adminService.getAll().catch(() => []),
          consorcioService.getAll().catch(() => []),
        ]);

        if (cancelled) return;

        const items: ClienteItem[] = [];

        // 1. Particulares (Clientes Privados)
        particulares.forEach(p => {
          items.push({
            id: p.id,
            nombre: p.nombre,
            direccion: [p.direccion, p.localidad].filter(Boolean).join(', '),
            contacto: p.telefono_encargado || p.administrador_responsable || '',
            tipo: 'particular',
            tipoLabel: 'Cliente Privado',
          });
        });

        // 2. Administraciones
        administraciones.forEach(a => {
          items.push({
            id: a.id,
            nombre: a.nombre,
            direccion: a.direccion || '',
            contacto: a.telefono || a.contacto || '',
            tipo: 'administracion',
            tipoLabel: 'Administración',
          });
        });

        // 3. Consorcios
        consorcios.forEach(c => {
          items.push({
            id: c.id,
            nombre: c.nombre,
            direccion: [c.direccion, c.localidad].filter(Boolean).join(', '),
            contacto: c.telefono_encargado || c.encargado || '',
            tipo: 'consorcio',
            tipoLabel: 'Consorcio',
          });
        });

        setClientes(items);
      } catch (err) {
        console.error('[ClienteSelectorModal] Error cargando clientes:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const query = busqueda.toLowerCase().trim();
  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(query) ||
    c.direccion.toLowerCase().includes(query)
  );

  const privados = filtered.filter(c => c.tipo === 'particular');
  const admsYConsorcios = filtered.filter(c => c.tipo === 'administracion' || c.tipo === 'consorcio');

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.selectorModalCard}>
        {/* Cabecera */}
        <div className={styles.selectorHeader}>
          <div className={styles.selectorTitleBlock}>
            <span className={styles.selectorPreTitle}>SELECCIONAR CLIENTE</span>
            <h3 className={styles.selectorTitle}>Buscar o elegir cliente</h3>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar selector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador */}
        <div className={styles.selectorSearchBox}>
          <Search size={17} className={styles.selectorSearchIcon} />
          <input
            type="text"
            className={styles.selectorSearchInput}
            placeholder="Buscar por nombre o dirección..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            autoFocus
          />
          {busqueda && (
            <button
              type="button"
              className={styles.selectorSearchClear}
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Contenido / Listado */}
        <div className={styles.selectorListContainer}>
          {loading ? (
            <div className={styles.selectorLoadingBox}>
              <div className={styles.spinner} />
              <span>Cargando clientes...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.selectorEmptyBox}>
              <span>No se encontraron clientes con "{busqueda}"</span>
            </div>
          ) : (
            <>
              {/* Sección CLIENTES PRIVADOS */}
              {privados.length > 0 && (
                <div className={styles.selectorSection}>
                  <div className={styles.selectorSectionTitle}>
                    <User size={13} />
                    <span>CLIENTES PRIVADOS ({privados.length})</span>
                  </div>
                  <div className={styles.selectorItemsList}>
                    {privados.map(c => {
                      const isSelected = selectedId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.selectorItem} ${isSelected ? styles.selectorItemSelected : ''}`}
                          onClick={() => {
                            onSelect(c);
                            onClose();
                          }}
                        >
                          <div className={styles.selectorItemIcon}>
                            <User size={16} />
                          </div>
                          <div className={styles.selectorItemInfo}>
                            <div className={styles.selectorItemNameRow}>
                              <span className={styles.selectorItemName}>{c.nombre}</span>
                              <span className={styles.selectorItemBadgePrivado}>Privado</span>
                            </div>
                            {c.direccion && (
                              <span className={styles.selectorItemSub}>{c.direccion}</span>
                            )}
                            {c.contacto && (
                              <span className={styles.selectorItemSub}>Tel: {c.contacto}</span>
                            )}
                          </div>
                          {isSelected && (
                            <div className={styles.selectorItemCheck}>
                              <Check size={16} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección ADMINISTRACIONES / CONSORCIOS */}
              {admsYConsorcios.length > 0 && (
                <div className={styles.selectorSection}>
                  <div className={styles.selectorSectionTitle}>
                    <Building2 size={13} />
                    <span>ADMINISTRACIONES / CONSORCIOS ({admsYConsorcios.length})</span>
                  </div>
                  <div className={styles.selectorItemsList}>
                    {admsYConsorcios.map(c => {
                      const isSelected = selectedId === c.id;
                      const isConsorcio = c.tipo === 'consorcio';
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.selectorItem} ${isSelected ? styles.selectorItemSelected : ''}`}
                          onClick={() => {
                            onSelect(c);
                            onClose();
                          }}
                        >
                          <div className={styles.selectorItemIcon}>
                            {isConsorcio ? <Home size={16} /> : <Building2 size={16} />}
                          </div>
                          <div className={styles.selectorItemInfo}>
                            <div className={styles.selectorItemNameRow}>
                              <span className={styles.selectorItemName}>{c.nombre}</span>
                              <span className={isConsorcio ? styles.selectorItemBadgeConsorcio : styles.selectorItemBadgeAdmin}>
                                {c.tipoLabel}
                              </span>
                            </div>
                            {c.direccion && (
                              <span className={styles.selectorItemSub}>{c.direccion}</span>
                            )}
                            {c.contacto && (
                              <span className={styles.selectorItemSub}>Contacto: {c.contacto}</span>
                            )}
                          </div>
                          {isSelected && (
                            <div className={styles.selectorItemCheck}>
                              <Check size={16} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botón para crear nuevo cliente */}
        <div className={styles.selectorFooter}>
          <button
            type="button"
            className={styles.selectorCreateBtn}
            onClick={() => {
              onClose();
              onOpenCreate();
            }}
          >
            <Plus size={16} />
            <span>Crear nuevo cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
