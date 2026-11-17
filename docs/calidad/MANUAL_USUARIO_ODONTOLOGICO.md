# Manual de Usuario del Odontólogo

## Sistema de Gestión Odontológica

Este manual explica cómo utilizar el portal clínico para registrar pacientes,
organizar citas, controlar condiciones preoperatorias, documentar tratamientos,
registrar cobros y gestionar recordatorios de seguimiento.

## 1. Acceso al sistema (HU-01)

1. Abra la dirección del sistema en el navegador.
2. En **Portal Odontológico Seguro**, introduzca su correo profesional.
3. Introduzca su contraseña médica. El botón de visibilidad permite revisar la
   contraseña antes de enviarla; el sistema avisa si `Caps Lock` está activo.
4. Seleccione **Iniciar sesión**.
5. Si las credenciales son correctas, se abrirá el directorio de pacientes. Si
   son incorrectas, revise el mensaje mostrado y vuelva a intentarlo.
6. Para salir, abra la barra lateral y seleccione **Cerrar sesión**.

La sesión se valida contra el servidor y las operaciones clínicas requieren
autenticación. No comparta sus credenciales ni deje la sesión abierta en un
equipo sin supervisión.

## 2. Navegación general

La barra lateral contiene estos módulos:

- **Directorio de Pacientes**: alta de pacientes, búsqueda y estado
  preoperatorio.
- **Validación de Exámenes**: revisión y validación de evidencia hematológica.
- **Agenda Diaria**: citas, estados, cobros y recordatorios.
- **Antecedentes Médicos**: antecedentes, alertas clínicas y auditoría.
- **Historial Clínico**: tratamientos y evolución cronológica.
- **Retorno de Pacientes**: profilaxis vencida y lista mensual de retorno.

En pantallas pequeñas, use el botón de menú para abrir la barra lateral. Puede
colapsarla en escritorio para ampliar el área de trabajo.

## 3. Directorio y registro de pacientes (HU-02 y HU-12)

### Registrar un paciente

1. Entre en **Directorio de Pacientes**.
2. Seleccione **Registrar Nuevo Paciente**.
3. Complete:
   - **Nombre**: al menos tres caracteres, solo letras y espacios.
   - **Teléfono**: exactamente ocho dígitos.
   - **Edad**: número entero entre 1 y 110.
4. Seleccione **Guardar en Directorio**.
5. Confirme el aviso de registro exitoso. El nuevo paciente aparecerá en el
   directorio.

Los errores se muestran junto al campo correspondiente. Corríjalos antes de
volver a guardar.

### Buscar y filtrar

1. Escriba un nombre o teléfono en el buscador del directorio.
2. Use los filtros **Todos**, **Luz verde** o **Pendientes** para mostrar,
   respectivamente, todos los pacientes, aquellos con exámenes validados o
   aquellos que aún requieren revisión.
3. Seleccione **Validar** en la tarjeta de un paciente para abrir directamente
   su ficha de exámenes.

La búsqueda también está disponible al seleccionar un paciente en **Historial
Clínico** y **Antecedentes Médicos**.

## 4. Antecedentes médicos y auditoría (HU-03)

1. Abra **Antecedentes Médicos**.
2. Busque y seleccione al paciente.
3. Revise las alertas clínicas que aparecen en la ficha.
4. Seleccione **Editar** para modificar los antecedentes.
5. Registre, según corresponda:
   - diabetes y tipo de diabetes;
   - hipertensión, cardiopatía y uso de anticoagulantes;
   - embarazo;
   - alergias;
   - medicación actual;
   - otras condiciones.
6. Para cada alergia, escríbala y agréguela a la lista.
7. Escriba el **motivo del cambio**.
8. Seleccione **Guardar cambios con auditoría**.

El sistema recalcula las alertas clínicas y conserva los cambios en el historial
de auditoría. Use **Ver historial de auditoría** para revisar qué campo cambió,
su valor anterior, el valor nuevo, el motivo, el usuario y la fecha.

## 5. Agenda diaria y estados de cita (HU-04, HU-05 y HU-06)

### Consultar la agenda

1. Abra **Agenda Diaria**.
2. Use **Anterior**, **Siguiente** o **Hoy** para cambiar la fecha.
3. Revise las citas en la vista horaria y el resumen de citas del día.
4. Seleccione una cita para consultar sus datos y acciones disponibles.

### Crear una cita con duración dinámica

1. Seleccione **Agendar Nueva Cita**.
2. Elija al paciente.
3. Seleccione la fecha y hora de inicio.
4. Elija una duración rápida:
   - **30 min** para consulta o diagnóstico;
   - **1 hora** para limpieza o curación;
   - **2 horas** para endodoncia o cirugía;
   - **Personalizado** para indicar manualmente la hora de fin.
5. Escriba el motivo de la cita.
6. Seleccione **Confirmar y Agendar Cita**.

El sistema rechaza horarios con fin anterior al inicio y evita solapamientos con
otras citas. Si el horario no está disponible, cambie la hora o la duración y
vuelva a guardar.

### Cambiar el estado

Desde las acciones de la cita, seleccione el estado que corresponda:

- **Programada**: cita pendiente de atención.
- **Atendida**: atención realizada.
- **Cancelada**: cita que no se realizará.

Confirme el cambio y revise el mensaje de resultado. Registre el estado real de
la atención para que los cobros y reportes clínicos mantengan consistencia.

## 6. Validación de exámenes de sangre (HU-07)

1. Abra **Validación de Exámenes** o seleccione **Validar** desde el directorio.
2. Busque al paciente y selecciónelo.
3. Revise sus datos, el estado actual y la evidencia disponible.
4. Adjunte el estudio hematológico escaneado.
5. Registre los parámetros hematológicos relevantes.
6. Revise el archivo y los datos antes de guardar.
7. Seleccione la acción de validación para conceder o retirar la **Luz Verde
   Médica**.

Para conceder la luz verde es obligatorio adjuntar evidencia. Use los filtros
**Validados** y **Pendientes** para organizar la revisión. La ficha conserva el
nombre del archivo, la evidencia, los parámetros y la fecha de validación.

## 7. Alerta bloqueante para extracciones (HU-08)

Antes de registrar una extracción, exodoncia o cirugía:

1. Seleccione al paciente en **Historial Clínico**.
2. Compruebe que sus exámenes estén validados.
3. Si no tiene luz verde, detenga el registro y complete primero el flujo de
   **Validación de Exámenes**.

El sistema detecta términos relacionados con extracción, exodoncia, cirugía,
muela, molar y procedimientos quirúrgicos, además del código CIE-10 de
extracción. Si faltan exámenes validados, muestra una **ALERTA ROJA
BLOQUEANTE** y no permite guardar el tratamiento.

## 8. Tratamientos y notación dental ISO 3950 (HU-09)

1. Abra **Historial Clínico** y seleccione al paciente.
2. En **Registrar Tratamiento (Nomenclatura Rápida)** escriba una entrada,
   por ejemplo `1A Caries` o `24 OD Resina`.
3. Revise la previsualización de la nomenclatura FDI/ISO 3950 y CIE-10.
4. Verifique que la pieza, superficie, diagnóstico y procedimiento sean los
   correctos.
5. Seleccione **Registrar tratamiento**.

El sistema valida la sintaxis de la notación y muestra errores antes de enviar.
No registre una extracción si el paciente no tiene exámenes validados.

## 9. Historial clínico cronológico (HU-10)

1. En **Historial Clínico**, busque al paciente por nombre o teléfono.
2. Selecciónelo para cargar su historial.
3. Use el selector de orden para ver los tratamientos del más reciente al más
   antiguo o en orden inverso.
4. Revise cada entrada con su fecha, nomenclatura, pieza, superficie,
   diagnóstico y descripción.

Si no existen tratamientos, el sistema lo indicará en la ficha. Registre cada
atención como una entrada separada para conservar una evolución clara.

## 10. Registro de cobros (HU-11)

1. Abra **Agenda Diaria** y localice la cita.
2. Marque primero la cita como **Atendida** cuando la atención haya concluido.
3. Seleccione **Registrar cobro**.
4. Introduzca el monto pagado.
5. Revise el importe y confirme.

El sistema permite registrar cobros únicamente para citas atendidas y rechaza
montos inválidos. Una vez registrado el pago, revise la tarjeta de la cita para
confirmar el monto mostrado.

## 11. Recordatorio por WhatsApp (HU-13)

1. Localice la cita en **Agenda Diaria** o al paciente en **Retorno de
   Pacientes**.
2. Seleccione el botón de WhatsApp.
3. Revise el número y el mensaje de recordatorio que se abrirán en WhatsApp.
4. Confirme el envío desde WhatsApp.

El sistema normaliza el número boliviano y construye un enlace seguro hacia
`wa.me`. Verifique el destinatario antes de enviar información clínica.

## 12. Profilaxis vencida a seis meses (HU-14)

1. Abra **Retorno de Pacientes**.
2. Revise la sección **Profilaxis vencida (6+ meses)**.
3. Para cada paciente, compruebe la fecha de la última profilaxis y los datos de
   contacto.
4. Use **WhatsApp** para invitarlo a un control preventivo o seleccione
   **Agendar** para crear una cita.
5. En el formulario de agenda, indique fecha y hora y confirme.

La lista se obtiene del servidor y se actualiza al recargar el módulo.

## 13. Lista mensual de retorno (HU-15)

1. En **Retorno de Pacientes**, revise la lista del mes actual.
2. Use los controles de mes anterior y siguiente para cambiar el período.
3. Revise la priorización y los datos de cada paciente sugerido.
4. Envíe una invitación por WhatsApp o abra **Agendar**.
5. Confirme la fecha y hora de la cita.

La lista mensual combina la fecha del último tratamiento/profilaxis y el
seguimiento pendiente. Antes de contactar al paciente, confirme que sus datos
sean correctos.

## 14. Buenas prácticas y solución de problemas

- Cierre sesión al terminar la jornada o antes de abandonar el equipo.
- Verifique siempre identidad, teléfono y fecha antes de guardar.
- Adjunte evidencia hematológica antes de autorizar procedimientos quirúrgicos.
- Registre el motivo al modificar antecedentes médicos.
- No use datos ficticios en producción.
- Si aparece un error de conexión, confirme que el backend esté disponible y
  vuelva a cargar el módulo.
- Si una cita es rechazada por solapamiento, elija otro horario o ajuste su
  duración.
- Si un botón no responde, revise el mensaje de error y no repita una operación
  de cobro hasta confirmar si el primer intento fue guardado.

## 15. Referencia rápida de la API clínica

Todas las rutas clínicas requieren la sesión autenticada:

| Función | Ruta |
| :--- | :--- |
| Iniciar sesión | `POST /api/auth/login` |
| Pacientes | `GET/POST /api/patients` |
| Validar exámenes | `PATCH /api/patients/:id/blood-exams` |
| Citas | `GET/POST /api/appointments` |
| Estado de cita | `PATCH /api/appointments/:id/status` |
| Cobro | `PATCH /api/appointments/:id/payment` |
| Antecedentes | `GET/PUT /api/patients/:id/medical-history` |
| Auditoría de antecedentes | `GET /api/patients/:id/medical-history/audit` |
| Historial de tratamientos | `GET/POST /api/patients/:id/history` |
| Profilaxis vencida | `GET /api/recall/profilaxis-vencidas` |
| Retorno mensual | `GET /api/recall/retorno-mensual?mes=YYYY-MM` |
