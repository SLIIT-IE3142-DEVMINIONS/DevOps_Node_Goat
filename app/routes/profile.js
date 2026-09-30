const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    const profile = new ProfileDAO(db);

    this.displayProfile = (req, res, next) => {
        const {
            userId
        } = req.session;

        profile.getByUserId(parseInt(userId), (err, doc) => {
            if (err) return next(err);

            doc.userId = userId;

            /*
             * The first name is used inside an href URL context.
             * Therefore, use URL encoding rather than HTML encoding.
             */
            doc.firstNameSafeURLString =
                ESAPI.encoder().encodeForURL(doc.firstName);

            return res.render("profile", {
                ...doc,
                environmentalScripts
            });
        });
    };

    this.handleProfileUpdate = (req, res, next) => {

        const {
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting
        } = req.body;

        /*
         * Validate first name input.
         * Reject HTML tags and javascript: input.
         */
        if (/<[^>]*>|javascript:/i.test(firstName)) {
            return res.render("profile", {
                updateError:
                    "Invalid input. Please enter a valid first name.",
                firstName: "",
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                environmentalScripts
            });
        }

        /*
         * Fix for Section: ReDoS attack
         * Use a single quantifier to avoid catastrophic backtracking.
         */
        const regexPattern = /([0-9]+)\#/;

        const testComplyWithRequirements =
            regexPattern.test(bankRouting);

        if (testComplyWithRequirements !== true) {

            const firstNameSafeURLString =
                ESAPI.encoder().encodeForURL(firstName);

            return res.render("profile", {
                updateError:
                    "Bank Routing number does not comply with requirements for format specified",

                firstNameSafeURLString,
                firstName,
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                environmentalScripts
            });
        }

        const {
            userId
        } = req.session;

        profile.updateUser(
            parseInt(userId),
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting,

            (err, user) => {

                if (err) return next(err);

                /*
                 * Create a URL-context encoded version of the first name
                 * before rendering it inside the href attribute.
                 */
                user.firstNameSafeURLString =
                    ESAPI.encoder().encodeForURL(user.firstName);

                user.updateSuccess = true;
                user.userId = userId;

                return res.render("profile", {
                    ...user,
                    environmentalScripts
                });
            }
        );
    };
}

module.exports = ProfileHandler;