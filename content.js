
function createLabelNode(formattedGainText) {
    const outerLabel = document.createElement("span");
    outerLabel.classList.add("descriptive");
    outerLabel.innerText = formattedGainText;

    outerLabel.setAttribute("id", "quirk-spoiler");
    return outerLabel;
}

function formatQuirkList(quirks) {
    if (quirks.length === 1) {
        return quirks[0]
    } else if (quirks.length === 2) {
        return `${quirks[0]} and ${quirks[1]}`;
    } else if (quirks.length === 3) {
        return `${quirks[1]}, ${quirks[1]} and ${quirks[2]}`;
    }

    return quirks.join(", ");
}

function createSpoilerMessage(gains, loses) {
    if (gains.length === 1 && loses.length === 1) {
        return `This will raise ${gains[0]} and lower ${loses[0]}.`;
    }

    if (gains.length === 1 && loses.length === 0) {
        let article = "a";
        if (gains[0][0] === "A") {
            article = "an";
        }
        return `This is ${article} ${gains[0]} choice.`;
    }

    if (gains.length === 0 && loses.length > 0) {
        return `This will lower ${formatQuirkList(loses)}.`;
    }

    if (gains.length > 0 && loses.length === 0) {
        return `This will raise ${formatQuirkList(gains)}.`;
    }

    return `This will raise ${formatQuirkList(gains)}. It will also lower ${formatQuirkList(loses)}.`;
}

let mainContentObserver = new MutationObserver(((mutations, observer) => {
    for (let m = 0; m < mutations.length; m++) {
        const mutation = mutations[m];

        for (let n = 0; n < mutation.addedNodes.length; n++) {
            const node = mutation.addedNodes[n];

            if (node.nodeName.toLowerCase() === "div") {
                let branches = null;
                if (node.hasAttribute("data-branch-id")) {
                    branches = [node];
                } else {
                    branches = node.querySelectorAll("div[data-branch-id]");
                }

                for (const branchContainer of branches) {
                    const branchId = branchContainer.attributes["data-branch-id"].value;
                    const description = branchContainer.querySelector("div[class='media__body branch__body'] > div > p");

                    if (!description) {
                        continue;
                    }

                    if (description.querySelector("span[id='quirk-spoiler']")) {
                        continue;
                    }

                    const annotation = description.querySelector("span[class='descriptive']");

                    const key = `id_${branchId}`;
                    const recordedGains = QUIRK_CHANGES.Gains[key];
                    const recordedLoses = QUIRK_CHANGES.Loses[key];

                    const gains = [...(recordedGains || [])]
                    const loses = [...(recordedLoses || [])]

                    if (annotation) {
                        for (const i in gains) {
                            if (annotation.textContent.includes(gains[i])) {
                                console.debug(`[FL Quirk Master] Removing ${gains[i]}, as it is already mentioned.`)
                                gains.splice(i, 1);
                            }
                        }

                        for (const i in loses) {
                            if (annotation.textContent.includes(loses[i])) {
                                console.debug(`[FL Quirk Master] Removing ${loses[i]}, as it is already mentioned.`)
                                loses.splice(i, 1);
                            }
                        }
                    }

                    if (gains.length === 0 && loses.length === 0) {
                        continue;
                    }

                    const branchText = description.textContent;
                    const spoilerMessage = `Quirk Master says: ` + createSpoilerMessage(gains || [], loses || []);
                    const textContainer = document.createElement("p");
                    textContainer.textContent = branchText;

                    const spoilerNode = createLabelNode(spoilerMessage);
                    const spoilerContainer = document.createElement("p");
                    spoilerContainer.appendChild(spoilerNode);

                    if (!annotation) {
                        description.textContent = "";

                        description.appendChild(textContainer);
                        description.appendChild(spoilerContainer);
                    } else {
                        // annotation.textContent += ` ${spoilerMessage}`;
                        annotation.parentElement.appendChild(spoilerContainer);
                    }
                }
            }
        }
    }
}));

mainContentObserver.observe(document, {childList: true, subtree: true});
