# Guía de Correcciones Requeridas por Historia de Usuario - Sprint 3
**Proyecto:** Consultorio Odontológico | **QA Revisora:** Equipo de Calidad  
**Objetivo:** Especificar los cambios exactos de código necesarios para pasar las pruebas incorporadas por QA y habilitar el merge a `develop`.

---

## 1. HU-11: Registro de Cobro en Citas Atendidas (PR #37)
**Rama:** `feature/HU-11_registro-cobro`  
**Autor:** drArancibiaDelgado  
**Pruebas que fallan actualmente:** `CP-11-05`, `CP-11-06`, `CP-11-07`

### Corrección 1.1: Restringir cobro a citas en estado ATENDIDA en el Servicio
- **Archivo:** `backend/src/services/appointment.service.ts`
- **Método:** `registerPayment(appointmentId: string, montoPagado: number)`

```typescript
// Reemplazar la validación inicial del método por:
  async registerPayment(appointmentId: string, montoPagado: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    if (appointment.estado !== 'ATENDIDA') {
      throw new Error('Solo se pueden registrar cobros en citas atendidas');
    }

    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { monto_pagado: montoPagado },
      include: {
        patient: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            examenes_sangre_validados: true,
          },
        },
      },
    });
  }
```

### Corrección 1.2: Responder HTTP 422 ante cita no atendida en el Controlador
- **Archivo:** `backend/src/controllers/appointment.controller.ts`
- **Método:** `registerPayment`

```typescript
// En el bloque catch:
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Error de validación',
          issues: error.issues,
        });
      }
      if (error instanceof Error && error.message === 'Cita no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Solo se pueden registrar cobros en citas atendidas') {
        return res.status(422).json({ error: error.message });
      }
      console.error('Error al registrar el cobro de la cita:', error);
      return res.status(500).json({ error: 'Error interno al registrar el cobro' });
    }
```

### Corrección 1.3: Limpieza visual de emojis en frontend
- **Archivo:** `frontend/src/components/DailyAgenda.tsx`
- **Línea 697:** Reemplazar el ícono del calendario por texto estándar "Agendar Nueva Cita".
- **Línea 732 y 933:** Retirar caracteres gráficos y mantener los textos clínicos "Exámenes Validados", "Pendiente / Sin Exámenes" y "Bloqueado por Seguridad Clínica".

---

## 2. HU-10: Historial Cronológico de Tratamientos (PR #38)
**Rama:** `feature/HU-10_historial-tratamientos`  
**Autor:** Luxianaa  
**Observación:** Advertencia de linter `react(set-state-in-effect)`

### Corrección 2.1: Envolver carga dentro del efecto
- **Archivo:** `frontend/src/components/PatientHistory.tsx`
- **Líneas 99 a 103:**

```typescript
// Reemplazar:
  useEffect(() => {
    let activo = true;
    if (selectedPatientId) {
      void (async () => {
        if (activo) {
          await fetchHistory(selectedPatientId, orden);
        }
      })();
    }
    return () => {
      activo = false;
    };
  }, [selectedPatientId, orden, fetchHistory]);
```

### Corrección 2.2: Sincronización con develop
- Ejecutar en terminal:
  ```bash
  git pull origin develop
  ```

---

## 3. HU-13: Recordatorio de Citas por WhatsApp (PR #36)
**Rama:** `feature/HU-13_boton-whatsapp`  
**Autor:** drArancibiaDelgado  
**Estado:** Pruebas unitarias y E2E agregadas y aprobadas por QA.

### Corrección 3.1: Descargar pruebas de QA
- Ejecutar en terminal:
  ```bash
  git pull origin feature/HU-13_boton-whatsapp
  ```

### Corrección 3.2: Protección ante teléfono nulo
- **Archivo:** `frontend/src/components/DailyAgenda.tsx`
- **Línea 352:**
  ```typescript
  const whatsappUrl = buildWhatsAppReminderUrl(patientPhone || '', patientName, fechaInicio, motivo);
  ```

---

## 4. Comandos de Verificación de Cobertura

Una vez aplicados los cambios, cada desarrollador puede verificar localmente:

```bash
# 1. Pruebas y cobertura de backend (meta >= 80% en lógica crítica)
cd backend
npm run test:coverage

# 2. Análisis estático (0 errores, 0 advertencias)
cd ../frontend
npm run lint

# 3. Pruebas de sistema E2E
npx cypress run
```
