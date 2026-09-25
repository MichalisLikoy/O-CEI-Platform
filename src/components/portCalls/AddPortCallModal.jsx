import {
    CheckCircle2,
    LoaderCircle,
    Search,
    Ship,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { getVessels } from '../../services/vesselsService';
import { createPortCall } from '../../services/portCallsService';



const EMPTY_FORM = {
    mmsi: '',
    imo: '',
    vessel_name: '',
    vessel_type: '',
    vessel_subtype: '',
    length: '',
    beam: '',
    gt: '',
    dw: '',
    estimated_teu: '',

    term: '',
    port: 'Malta Freeport',
    berth: '',
    eta: '',
    etd: '',
    ata: '',
    atd: '',
};

function normalizeMmsi(value) {
    return String(value || '').trim();
}



function nullableValue(value) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return null;
    }

    return value;
}

function nullableNumber(value) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function toMysqlDateTime(value) {
    if (!value) {
        return null;
    }

    const normalizedValue = value.replace('T', ' ');

    if (normalizedValue.length === 16) {
        return `${normalizedValue}:00`;
    }

    return normalizedValue;
}

function AddPortCallModal({
    onClose,
    onCreated,
}) {
    const [formData, setFormData] =
        useState(EMPTY_FORM);

    const [checkingVessel, setCheckingVessel] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [vesselFound, setVesselFound] =
        useState(null);

    const [error, setError] = useState('');

    useEffect(() => {
        function handleEscape(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener(
            'keydown',
            handleEscape,
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleEscape,
            );
        };
    }, [onClose]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));

        if (name === 'mmsi') {
            setVesselFound(null);
        }
    }

    async function handleCheckVessel() {
        const mmsi = normalizeMmsi(
            formData.mmsi,
        );

        if (!mmsi) {
            setError('Please enter an MMSI.');
            return;
        }

        try {
            setCheckingVessel(true);
            setError('');
            setVesselFound(null);

            const vesselsResponse =
                await getVessels();

            const vessels = Array.isArray(
                vesselsResponse,
            )
                ? vesselsResponse
                : [];

            const existingVessel = vessels.find(
                (vessel) =>
                    normalizeMmsi(vessel.mmsi) ===
                    mmsi,
            );

            if (!existingVessel) {
                setVesselFound(false);

                setFormData((currentFormData) => ({
                    ...currentFormData,
                    imo: '',
                    vessel_name: '',
                    vessel_type: '',
                    vessel_subtype: '',
                    length: '',
                    beam: '',
                    gt: '',
                    dw: '',
                    estimated_teu: '',
                }));

                return;
            }

            setVesselFound(true);

            setFormData((currentFormData) => ({
                ...currentFormData,

                mmsi: normalizeMmsi(
                    existingVessel.mmsi,
                ),

                imo:
                    existingVessel.imo ?? '',

                vessel_name:
                    existingVessel.vessel_name ?? '',

                vessel_type:
                    existingVessel.vessel_type ?? '',

                vessel_subtype:
                    existingVessel.vessel_subtype ?? '',

                length:
                    existingVessel.length ?? '',

                beam:
                    existingVessel.beam ?? '',

                gt:
                    existingVessel.gt ?? '',

                dw:
                    existingVessel.dw ?? '',

                estimated_teu:
                    existingVessel.estimated_teu ?? '',
            }));
        } catch (requestError) {
            console.error(requestError);

            setError(
                'Unable to check vessel information.',
            );
        } finally {
            setCheckingVessel(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const mmsi = normalizeMmsi(
            formData.mmsi,
        );

        if (!mmsi) {
            setError('MMSI is required.');
            return;
        }

        if (!formData.eta) {
            setError('ETA is required.');
            return;
        }

        if (
            vesselFound === false &&
            !formData.vessel_name.trim()
        ) {
            setError(
                'Vessel name is required for a new vessel.',
            );

            return;
        }

        if (
            vesselFound === false &&
            !formData.vessel_type.trim()
        ) {
            setError(
                'Vessel type is required for a new vessel.',
            );

            return;
        }

        const payload = {
            mmsi,

            imo: nullableValue(
                formData.imo,
            ),

            vessel_name: nullableValue(
                formData.vessel_name,
            ),

            vessel_type: nullableValue(
                formData.vessel_type,
            ),

            vessel_subtype: nullableValue(
                formData.vessel_subtype,
            ),

            length: nullableNumber(
                formData.length,
            ),

            beam: nullableNumber(
                formData.beam,
            ),

            gt: nullableNumber(
                formData.gt,
            ),

            dw: nullableNumber(
                formData.dw,
            ),

            estimated_teu: nullableNumber(
                formData.estimated_teu,
            ),

            term: nullableValue(
                formData.term,
            ),

            port:
                nullableValue(formData.port) ||
                'Malta Freeport',

            berth: nullableValue(
                formData.berth,
            ),

            eta: toMysqlDateTime(
                formData.eta,
            ),

            etd: toMysqlDateTime(
                formData.etd,
            ),

            ata: toMysqlDateTime(
                formData.ata,
            ),

            atd: toMysqlDateTime(
                formData.atd,
            ),
        };

        try {
            setSubmitting(true);
            setError('');

            const response =
                await createPortCall(payload);

            await onCreated(response);
        } catch (requestError) {
            console.error(requestError);

            setError(
                requestError.message ||
                'Unable to create port call.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    function handleClearVessel() {
        setFormData({
            ...EMPTY_FORM,
            port: 'Malta Freeport',
        });

        setVesselFound(null);
        setError('');
    }

    const vesselFieldsLocked = vesselFound === true;

    return (
        <>
            <button
                type="button"
                className="add-port-call-backdrop"
                aria-label="Close add port call form"
                onClick={onClose}
            />

            <section
                className="add-port-call-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Add port call"
            >
                <header className="add-port-call-header">
                    <div>
                        <span>Port operations</span>
                        <h2>Add Port Call</h2>
                    </div>

                    <button
                        type="button"
                        className="add-port-call-close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="add-port-call-content">
                        <section className="add-port-call-section">
                            <div className="add-port-call-section-title">
                                <Ship size={18} />

                                <div>
                                    <h3>Vessel information</h3>
                                    <p>
                                        Enter the MMSI and check whether
                                        the vessel already exists.
                                    </p>
                                </div>
                            </div>

                            <div className="add-port-call-mmsi-row">
                                <label>
                                    <span>MMSI *</span>

                                    <input
                                        type="text"
                                        name="mmsi"
                                        value={formData.mmsi}
                                        onChange={handleChange}
                                        placeholder="e.g. 256051000"
                                        required
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="check-vessel-button"
                                    onClick={
                                        vesselFound === true
                                            ? handleClearVessel
                                            : handleCheckVessel
                                    }
                                    disabled={
                                        checkingVessel ||
                                        (
                                            vesselFound !== true &&
                                            !formData.mmsi.trim()
                                        )
                                    }
                                >
                                    {vesselFound === true ? (
                                        <>
                                            <X size={16} />
                                            Clear
                                        </>
                                    ) : checkingVessel ? (
                                        <>
                                            <LoaderCircle
                                                size={16}
                                                className="button-icon-spin"
                                            />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={16} />
                                            Check vessel
                                        </>
                                    )}
                                </button>
                            </div>

                            {vesselFound === true && (
                                <div className="vessel-check-message vessel-check-found">
                                    <CheckCircle2 size={17} />

                                    Existing vessel found. Its details
                                    have been filled automatically.
                                </div>
                            )}

                            {vesselFound === false && (
                                <div className="vessel-check-message vessel-check-new">
                                    <Ship size={17} />

                                    New vessel. Complete the vessel
                                    details below.
                                </div>
                            )}

                            <div className="add-port-call-grid">
                                <label>
                                    <span>IMO</span>

                                    <input
                                        type="text"
                                        name="imo"
                                        value={formData.imo}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>Vessel name</span>

                                    <input
                                        type="text"
                                        name="vessel_name"
                                        value={formData.vessel_name}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                        required={vesselFound === false}
                                    />
                                </label>

                                <label>
                                    <span>Vessel type</span>

                                    <select
                                        name="vessel_type"
                                        value={formData.vessel_type}
                                        onChange={handleChange}
                                        required={
                                            vesselFound === false
                                        }
                                        disabled={vesselFieldsLocked}
                                    >
                                        <option value="">
                                            Select type
                                        </option>

                                        <option value="Container">
                                            Container
                                        </option>

                                        <option value="Tanker">
                                            Tanker
                                        </option>

                                        <option value="Cargo">
                                            Cargo
                                        </option>

                                        <option value="Port Service Vessel">
                                            Port Service Vessel
                                        </option>

                                        <option value="Pilot">
                                            Pilot
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    <span>Vessel subtype</span>

                                    <input
                                        type="text"
                                        name="vessel_subtype"
                                        value={formData.vessel_subtype}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>Length (m)</span>

                                    <input
                                        type="number"
                                        step="0.01"
                                        name="length"
                                        value={formData.length}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>Beam (m)</span>

                                    <input
                                        type="number"
                                        step="0.01"
                                        name="beam"
                                        value={formData.beam}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>GT</span>

                                    <input
                                        type="number"
                                        name="gt"
                                        value={formData.gt}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>DW</span>

                                    <input
                                        type="number"
                                        name="dw"
                                        value={formData.dw}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>

                                <label>
                                    <span>Estimated TEU</span>

                                    <input
                                        type="number"
                                        name="estimated_teu"
                                        value={formData.estimated_teu}
                                        onChange={handleChange}
                                        readOnly={vesselFieldsLocked}
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="add-port-call-section">
                            <div className="add-port-call-section-title">
                                <CheckCircle2 size={18} />

                                <div>
                                    <h3>Port call information</h3>
                                    <p>
                                        Complete the operational
                                        information for this call.
                                    </p>
                                </div>
                            </div>

                            <div className="add-port-call-grid">
                                <label>
                                    <span>Port</span>

                                    <input
                                        type="text"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    <span>Terminal</span>

                                    <input
                                        type="text"
                                        name="term"
                                        value={formData.term}
                                        onChange={handleChange}
                                        placeholder="Terminal name"
                                    />
                                </label>

                                <label>
                                    <span>Berth</span>

                                    <input
                                        type="text"
                                        name="berth"
                                        value={formData.berth}
                                        onChange={handleChange}
                                        placeholder="NORTH / SOUTH"
                                    />
                                </label>

                                <label>
                                    <span>ETA *</span>

                                    <input
                                        type="datetime-local"
                                        name="eta"
                                        value={formData.eta}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    <span>ATA</span>

                                    <input
                                        type="datetime-local"
                                        name="ata"
                                        value={formData.ata}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    <span>ETD</span>

                                    <input
                                        type="datetime-local"
                                        name="etd"
                                        value={formData.etd}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label>
                                    <span>ATD</span>

                                    <input
                                        type="datetime-local"
                                        name="atd"
                                        value={formData.atd}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>
                        </section>

                        {error && (
                            <div className="add-port-call-error">
                                {error}
                            </div>
                        )}
                    </div>

                    <footer className="add-port-call-footer">
                        <button
                            type="button"
                            className="drawer-secondary-button"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="drawer-primary-button"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <LoaderCircle
                                        size={16}
                                        className="button-icon-spin"
                                    />

                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Complete
                                </>
                            )}
                        </button>
                    </footer>
                </form>
            </section>
        </>
    );
}

export default AddPortCallModal;