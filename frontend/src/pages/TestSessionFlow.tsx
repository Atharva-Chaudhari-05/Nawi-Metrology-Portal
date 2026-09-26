import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isReadingPass, AccuracyClass } from '../utils/oiml-calculator';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Save, Play } from 'lucide-react';

const TEST_TYPES = [
  { id: 'REPEATABILITY', label: 'Repeatability' },
  { id: 'ECCENTRICITY', label: 'Eccentricity' },
  { id: 'WEIGHING_PERFORMANCE', label: 'Weighing Performance' },
  { id: 'ZERO_SETTING', label: 'Zero Setting' },
  { id: 'ZERO_TRACKING', label: 'Zero Tracking' },
  { id: 'VISUAL_INSPECTION', label: 'Visual Inspection' }
];

export const TestSessionFlow: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const instrumentId = searchParams.get('instrumentId');

  const [step, setStep] = useState(1);
  const [instrument, setInstrument] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Step 1: Conditions & Tests
  const [conditions, setConditions] = useState({
    labTemperature: '',
    labHumidity: '',
    labAtmosphericPressure: ''
  });
  const [selectedTests, setSelectedTests] = useState<string[]>(['REPEATABILITY', 'ECCENTRICITY', 'WEIGHING_PERFORMANCE', 'ZERO_SETTING', 'ZERO_TRACKING', 'VISUAL_INSPECTION']);

  // Step 2: Test Data State
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({}); // Record<TestType, { loadPoint, ref, ind }[]>
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  
  // Current Table State
  const [readings, setReadings] = useState([{ loadPoint: 1, referenceValue: '', indicatedValue: '' }]);

  useEffect(() => {
    if (!instrumentId) {
      navigate('/instruments');
      return;
    }

    const init = async () => {
      try {
        const res = await fetch(`/api/instruments/${instrumentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setInstrument(data);
        } else {
          setError(data.error || 'Failed to fetch instrument details');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [instrumentId, token, navigate]);

  const handleCreateSession = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/test-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instrumentId,
          ...conditions
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session.id);
        setStep(2);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReading = () => {
    setReadings([...readings, { loadPoint: readings.length + 1, referenceValue: '', indicatedValue: '' }]);
  };

  const handleReadingChange = (index: number, field: string, value: string | number) => {
    const newReadings = [...readings];
    newReadings[index] = { ...newReadings[index], [field]: value };
    setReadings(newReadings);
  };

  const handleRemoveReading = (index: number) => {
    if (readings.length > 1) {
      setReadings(readings.filter((_, i) => i !== index).map((r, i) => ({ ...r, loadPoint: i + 1 })));
    }
  };

  const submitCurrentTest = async () => {
    if (!sessionId) return;
    setError('');
    
    const currentTest = selectedTests[currentTestIndex];

    // Validate rows
    const validReadings = currentTest === 'VISUAL_INSPECTION' 
      ? readings 
      : readings.filter(r => r.referenceValue !== '' && r.indicatedValue !== '');
      
    if (validReadings.length === 0) {
      setError('At least one valid reading is required');
      return;
    }

    let payload;
    if (currentTest === 'VISUAL_INSPECTION') {
      payload = readings.map(r => ({
        loadPoint: r.loadPoint,
        referenceValue: 0,
        indicatedValue: r.indicatedValue === 'PASS' ? 0 : 1
      }));
    } else {
      const overCapacity = validReadings.some(r => parseFloat(r.referenceValue) > instrument.maxCapacity);
      if (overCapacity) {
        setError(`Readings cannot exceed Max Capacity (${instrument.maxCapacity} kg)`);
        return;
      }
      payload = validReadings.map(r => ({
        loadPoint: r.loadPoint,
        referenceValue: parseFloat(r.referenceValue),
        indicatedValue: parseFloat(r.indicatedValue)
      }));
    }

    setIsLoading(true);
    try {
      const currentTest = selectedTests[currentTestIndex];
      const res = await fetch(`/api/test-sessions/${sessionId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          testType: currentTest,
          rawReadings: payload
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setTestResults({ ...testResults, [currentTest]: data.result.rawReadings });
        setCompletedTests([...completedTests, currentTest]);
        
        if (currentTestIndex < selectedTests.length - 1) {
          const nextTest = selectedTests[currentTestIndex + 1];
          setCurrentTestIndex(currentTestIndex + 1);
          if (nextTest === 'VISUAL_INSPECTION') {
             setReadings([
                { loadPoint: 'Level Indicator', referenceValue: '', indicatedValue: 'PASS' },
                { loadPoint: 'Zero-setting Device', referenceValue: '', indicatedValue: 'PASS' },
                { loadPoint: 'Display Segments', referenceValue: '', indicatedValue: 'PASS' },
                { loadPoint: 'Descriptive Markings', referenceValue: '', indicatedValue: 'PASS' }
             ]);
          } else {
             setReadings([{ loadPoint: 1, referenceValue: '', indicatedValue: '' }]);
          }
        } else {
          setStep(3); // All tests done, go to review
        }
      } else {
        setError(data.error || 'Failed to submit test results');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSession = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/test-sessions/${sessionId}/submit`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        navigate('/test-sessions');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit session');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error');
      setIsLoading(false);
    }
  };

  if (isLoading && step === 1 && !instrument) {
    return <div className="p-8 text-center text-textSecondary animate-pulse">Loading setup...</div>;
  }

  const renderStepper = () => (
    <div className="flex items-center space-x-2 text-sm font-medium text-textSecondary mb-8 bg-gray-50 p-4 rounded-lg border border-border">
      <span className={step >= 1 ? 'text-primary' : ''}>1. Lab Conditions</span>
      <ArrowRight className="h-4 w-4 mx-2 text-gray-300" />
      <span className={step >= 2 ? 'text-primary' : ''}>
        2. Data Entry {step === 2 && `(${currentTestIndex + 1}/${selectedTests.length})`}
      </span>
      <ArrowRight className="h-4 w-4 mx-2 text-gray-300" />
      <span className={step >= 3 ? 'text-primary' : ''}>3. Review & Submit</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {renderStepper()}

      {error && (
        <div className="p-4 bg-fail/10 text-fail rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Conditions */}
      {step === 1 && (
        <div className="card p-8">
          <h3 className="text-xl font-serif text-textPrimary mb-6">Start New Test Session</h3>
          <div className="bg-gray-50 p-4 rounded-md mb-8 flex justify-between items-center border border-border">
            <div>
              <p className="text-sm text-textSecondary">Instrument Under Test</p>
              <p className="font-medium text-textPrimary text-lg">{instrument?.modelName} <span className="text-sm font-normal text-textSecondary">(SN: {instrument?.serialNumber})</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-textSecondary">Max: {instrument?.maxCapacity}kg | e: {instrument?.eValue}kg</p>
              <p className="text-sm font-medium text-textPrimary">Class {instrument?.accuracyClass}</p>
            </div>
          </div>

          <h4 className="font-medium text-textPrimary mb-4">1. Lab Environmental Conditions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Temperature (°C)</label>
              <input type="number" className="input-field" value={conditions.labTemperature} onChange={e => setConditions({...conditions, labTemperature: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Humidity (%)</label>
              <input type="number" className="input-field" value={conditions.labHumidity} onChange={e => setConditions({...conditions, labHumidity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Atmospheric Pressure (hPa)</label>
              <input type="number" className="input-field" value={conditions.labAtmosphericPressure} onChange={e => setConditions({...conditions, labAtmosphericPressure: e.target.value})} />
            </div>
          </div>

          <h4 className="font-medium text-textPrimary mb-4">2. Tests to Perform (Phase 1 core)</h4>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {TEST_TYPES.map(test => (
              <label key={test.id} className="flex items-center space-x-3 p-4 border border-border rounded-md cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                  checked={selectedTests.includes(test.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTests([...selectedTests, test.id]);
                    else setSelectedTests(selectedTests.filter(id => id !== test.id));
                  }}
                />
                <span className="font-medium text-textPrimary">{test.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end border-t border-border pt-6">
            <button 
              onClick={handleCreateSession} 
              disabled={isLoading || selectedTests.length === 0} 
              className="btn-primary"
            >
              {isLoading ? 'Starting...' : 'Create Session & Begin Tests'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Data Entry */}
      {step === 2 && (
        <div className="card p-0 overflow-hidden">
          <div className="bg-primary/5 border-b border-border p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-serif text-textPrimary">{TEST_TYPES.find(t => t.id === selectedTests[currentTestIndex])?.label} Test</h3>
              <p className="text-sm text-textSecondary">Enter load points and indicated values. Validating against Class {instrument?.accuracyClass} / e={instrument?.eValue}kg.</p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-full border border-border text-sm font-medium text-primary shadow-sm">
              {selectedTests[currentTestIndex] === 'VISUAL_INSPECTION' 
                ? `${readings.length} items checked` 
                : `${readings.filter(r => r.referenceValue && r.indicatedValue).length} / ${readings.length} points recorded`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-textSecondary">{selectedTests[currentTestIndex] === 'VISUAL_INSPECTION' ? 'Item' : 'Pt.'}</th>
                  <th className="px-6 py-4 font-medium text-textSecondary">{selectedTests[currentTestIndex] === 'VISUAL_INSPECTION' ? 'Requirement' : 'Reference Load (kg)'}</th>
                  <th className="px-6 py-4 font-medium text-textSecondary">{selectedTests[currentTestIndex] === 'VISUAL_INSPECTION' ? 'Observation' : 'Indicated Value (kg)'}</th>
                  {selectedTests[currentTestIndex] !== 'VISUAL_INSPECTION' && <th className="px-6 py-4 font-medium text-textSecondary">Calc. Error</th>}
                  {selectedTests[currentTestIndex] !== 'VISUAL_INSPECTION' && <th className="px-6 py-4 font-medium text-textSecondary">MPE</th>}
                  <th className="px-6 py-4 font-medium text-textSecondary">Live Result</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readings.map((reading, idx) => {
                  let pass = true;
                  let errorVal = 0;
                  let mpeVal = 0;
                  const isVisual = selectedTests[currentTestIndex] === 'VISUAL_INSPECTION';
                  const hasData = isVisual ? true : (reading.referenceValue !== '' && reading.indicatedValue !== '');
                  
                  if (isVisual) {
                     pass = reading.indicatedValue === 'PASS';
                  } else if (hasData && instrument) {
                    const result = isReadingPass(
                      instrument.accuracyClass as AccuracyClass, 
                      instrument.eValue, 
                      parseFloat(reading.referenceValue as string), 
                      parseFloat(reading.indicatedValue as string)
                    );
                    pass = result.pass;
                    errorVal = result.error;
                    mpeVal = result.mpe;
                  }

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-textSecondary">{reading.loadPoint}</td>
                      <td className="px-6 py-2">
                        {isVisual ? (
                           <span className="text-textSecondary">Must be present & functional</span>
                        ) : (
                          <input 
                            type="number" step="any" min="0" 
                            className="input-field py-1.5" 
                            placeholder="e.g. 10.0"
                            value={reading.referenceValue}
                            onChange={(e) => handleReadingChange(idx, 'referenceValue', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="px-6 py-2">
                        {isVisual ? (
                          <select 
                            className="input-field py-1.5"
                            value={reading.indicatedValue}
                            onChange={(e) => handleReadingChange(idx, 'indicatedValue', e.target.value)}
                          >
                            <option value="PASS">Pass / OK</option>
                            <option value="FAIL">Fail / Defective</option>
                          </select>
                        ) : (
                          <input 
                            type="number" step="any" min="0" 
                            className="input-field py-1.5"
                            placeholder="e.g. 10.1"
                            value={reading.indicatedValue}
                            onChange={(e) => handleReadingChange(idx, 'indicatedValue', e.target.value)}
                          />
                        )}
                      </td>
                      {!isVisual && (
                        <>
                          <td className="px-6 py-4 font-mono text-textPrimary">
                            {hasData ? errorVal.toFixed(4) : '-'}
                          </td>
                          <td className="px-6 py-4 font-mono text-textSecondary">
                            {hasData ? `±${mpeVal.toFixed(4)}` : '-'}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        {hasData && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pass ? 'bg-success/10 text-success' : 'bg-fail/10 text-fail'}`}>
                            {pass ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {pass ? 'PASS' : 'FAIL'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRemoveReading(idx)} className="text-gray-400 hover:text-fail">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-border flex justify-between items-center bg-gray-50">
            {selectedTests[currentTestIndex] !== 'VISUAL_INSPECTION' && (
              <button onClick={handleAddReading} className="btn-secondary text-sm">
                + Add Row
              </button>
            )}
            {selectedTests[currentTestIndex] === 'VISUAL_INSPECTION' && <div></div>}
            <button 
              onClick={submitCurrentTest} 
              disabled={isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              <span>{currentTestIndex === selectedTests.length - 1 ? 'Save & Review' : 'Save & Next Test'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review */}
      {step === 3 && (
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-2xl font-serif text-textPrimary mb-2">Tests Completed</h3>
            <p className="text-textSecondary">Please review the recorded session data before final submission.</p>
          </div>

          <div className="space-y-6 mb-8">
            {selectedTests.map(test => (
              <div key={test} className="border border-border rounded-md p-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-medium text-textPrimary">{TEST_TYPES.find(t => t.id === test)?.label}</span>
                </div>
                <div className="text-sm text-textSecondary text-right">
                  Recorded <br/>
                  <span className="font-medium text-textPrimary">✓ Complete</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 p-6 rounded-md border border-primary/20 mb-8 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-textPrimary">
              Submitting this session will lock the data and move it to the Supervisor Review queue. 
              The authoritative PASS/FAIL verdict for the session is calculated by the server.
            </p>
          </div>

          <div className="flex justify-end space-x-4 border-t border-border pt-6">
            <button disabled={isLoading} onClick={handleSubmitSession} className="btn-primary px-8 flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Submitting...' : 'Submit Test Session'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
