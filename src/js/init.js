const version = 'v2';
const endpoint = 'api/' + version;
const issueCallout = document.getElementById('issue-callout');
const issueMessage = document.getElementById('issue-message');

const displayIssue = message => {
    console.log(message);
    issueMessage.innerText = message;
    issueCallout.style.display = 'block';
};

const model = new ChemDoodle.TransformCanvas3D('model', document.getElementById('model').clientWidth, document.getElementById('model').clientHeight);
model.specs.set3DRepresentation('Ball and Stick');
model.specs.atoms_sphereDiameter_3D = 300;
model.specs.backgroundColor = '#FFFFFF';
model.loadContent();

const sketcher = new ChemDoodle.SketcherCanvas('sketcher', document.getElementById('sketcher').clientWidth, document.getElementById('sketcher').clientHeight, {oneMolecule: true});
sketcher.specs.atoms_displayTerminalCarbonLabels_2D = true;
sketcher.specs.atoms_useJMOLColors = true;
sketcher.specs.bonds_clearOverlaps_2D = true;
sketcher.specs.bondLength_2D = 39;
sketcher.specs.atoms_font_size_2D = 13;
sketcher.repaint();

const computeSpinnerVisible = state => {
    state ? document.getElementById('compute-spinner').style.display = 'block' : document.getElementById('compute-spinner').style.display = 'none'
};

const updateSpectrum = (jcamp, name) => {
    const computed = new ChemDoodle.io.JCAMPInterpreter().makeStructureSpectrumSet('computed', jcamp);
    computed[0].resize(document.getElementById('computed_molecule').parentElement.clientWidth, document.getElementById('computed_molecule').parentElement.clientHeight);
    computed[1].resize(document.getElementById('computed_spectrum').parentElement.clientWidth, document.getElementById('computed_spectrum').parentElement.clientHeight);
    computed[1].spectrum.title = name;
    computed[0].specs.atoms_font_size_2D = 12;
    computed[0].specs.bonds_width_2D = 1.5;
    computed[0].repaint();
    computed[1].repaint();
};

const update = () => {
    computeSpinnerVisible(true);
    let mol = ChemDoodle.writeMOL(sketcher.getMolecule());
    fetch(endpoint + `/mol2DInput`, {
        method: 'post',
        headers: {"Content-type": "application/json; charset=UTF-8"},
        body: JSON.stringify({mol: mol})
    }).then(
        function (response) {
            if (response.status !== 200) {
                console.log('Error: ' + response.status);
                return;
            }
            response.json().then(function (data) {
                if (data.name === 'NAME UNKNOWN') {
                    data.name = '';
                    displayIssue('Cannot find molecule in database.');
                }
                if (data.mol === 'SDF UNKNOWN')
                    model.loadContent([]);
                else
                    model.loadContent([ChemDoodle.readMOL(data.mol, 1)]);
                if (data.jcamp === 'JCAMP UNKNOWN')
                    updateSpectrum('', data.name);
                else
                    updateSpectrum(data.jcamp, data.name);
            });
        }
    )
        .catch(function (err) {
            console.log('Fetch Error :', err);
            displayIssue('Fetch Error :', err);
        })
        .finally(() => {
            computeSpinnerVisible(false)
        });
};
