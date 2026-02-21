import { ChevronLeft } from "lucide-react";

export default function TermsPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Terms & Conditions</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 pb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6 text-sm">
          
          {/* Start Optimizing */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Start Optimizing Your App</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• 1.1) To start app optimization, you must deposit at least $101.</li>
              <li>• 1.2) After app optimization is complete, users can immediately initiate a withdrawal request or proceed directly to the next task. The withdrawal amount is determined by the user.</li>
            </ul>
          </section>

          {/* Regular Apps */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Regular Apps</h2>
            <ul className="space-y-2 text-gray-700">
              <li>1.1) VIP1 users will receive a 0.5% bonus for each app optimized.<br/>
              VIP2 users will receive a 0.5% bonus for each app optimized.<br/>
              VIP3 users will receive a 0.5% bonus for each app optimized.</li>
              <li>1.2) After app optimization is complete, funds and rewards will be returned to the user's account.</li>
              <li>1.3) The system will randomly assign apps based on the user's account balance.</li>
              <li>1.4) Once an app is assigned to a user's account, it cannot be canceled or skipped.</li>
              <li>1.5) To protect user rights, app fees will be increased based on the total reimbursement amount to increase revenue.</li>
            </ul>
          </section>

          {/* Premium Apps */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Premium Apps</h2>
            <ul className="space-y-2 text-gray-700">
              <li>1.1) A premium order contains two applications. Users do not always receive both applications; the system randomly assigns applications to orders, so a user may receive one application or both. A maximum of 0-3 premium orders can occur in a single order.</li>
              <li>1.2) • VIP1 users receive a 5% bonus for each app in a Premium order.<br/>
              • VIP2 users receive a 5% bonus for each app in a Premium order.<br/>
              • VIP3 users receive a 5% bonus for each app in a Premium order.<br/>
              • VIP4 users receive a 5% bonus for each app in a Premium order.<br/>
              • No bonus is offered for the first and second Premium orders.<br/>
              • For the third Premium order, the bonus is $2,000.<br/>
              • Within the same task group, there will be a maximum of three premium orders.</li>
              <li>1.3) When a Premium order is received, all fund flows cease. Once all included applications are completed, all funds will be returned to the user's account.</li>
              <li>1.4) The system randomly distributes Premium order applications to user accounts based on their total account balance.</li>
              <li>1.5) Premium order requests assigned to a user account cannot be canceled or skipped.</li>
            </ul>
          </section>

          {/* Deposit */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Deposit</h2>
            <ul className="space-y-2 text-gray-700">
              <li>2.1) The deposit amount is determined by the user. Since we cannot determine the deposit amount, we recommend that users make deposits based on their own circumstances or after becoming familiar with the platform.</li>
              <li>2.2) If a user's account balance is negative due to a Premium Order task, they can make a deposit based on the negative amount displayed on their account.</li>
              <li>2.3) Before making a deposit, users must submit a deposit request to online customer service and confirm the developer's wallet address information.</li>
              <li>2.4) Due to discrepancies in developer information, please contact customer service to obtain the developer's wallet address information before each deposit. Do not deposit funds to the incorrect developer wallet address; any resulting losses are the sole responsibility of the user.</li>
            </ul>
          </section>

          {/* Withdrawal */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Withdrawal</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• 2.1) All user funds will be securely stored in their accounts and will be fully withdrawn only after optimization is complete.</li>
              <li>• 2.1.1) When a single withdrawal exceeds $300 USD, the user must use the platform's designated official partner wallet, Crypto.com: Onchain. Users are advised to contact platform customer service in advance to complete the wallet binding process. Withdrawal requests will not be accepted without completing the binding.</li>
              <li>• 2.2) To avoid any financial losses, all users must strictly follow the correct withdrawal procedures as specified by the platform. The system processes withdrawal requests automatically; therefore, any operational errors during the withdrawal process may result in the account being temporarily frozen. In such cases, the withdrawal process will only resume after the error has been fully corrected and approved by the finance department.<br/><br/>
              <strong>Remediation Plan:</strong> If a withdrawal error is caused by user operations, the user must provide remediation funds equal to 20% of the account balance. These funds are required to restore the integrity of the account data and transaction records. Once the remediation is completed, the system will continue processing the user's withdrawal request.</li>
              <li>• 2.3) If membership is suspended or canceled during the app optimization process, no withdrawal or refund requests will be made.</li>
              <li>• 2.4) We will not process withdrawals without a user request.</li>
              <li>• 2.5) Withdrawals are not possible if your credit score is below 100, and this must be corrected according to platform rules.</li>
            </ul>
          </section>

          {/* Working with Developers */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Working with Developers</h2>
            <ul className="space-y-2 text-gray-700">
              <li>3.1) Different merchants post optimization orders on the platform every minute. If a task is left uncompleted for a long period of time, the unfinished task data will not be uploaded to the system, impacting the data upload process. To protect the merchant's reputation, users must complete the task within 8 hours. Otherwise, the order may be lost, or the merchant may file a complaint, leading to the task being frozen!</li>
              <li>3.2) To ensure that users complete tasks within the specified timeframe, developers must provide their wallet address information.</li>
              <li>• 3.3) Different applications are updated on the platform every minute. If an application is occupied and unpromoted for a long period of time, the application data will not be uploaded to the system, impacting the data upload process. To maintain the merchant's reputation, users must complete tasks within 8 hours. If tasks are not completed within the specified timeframe, the merchant will file a complaint and the order will be frozen!</li>
              <li>• 3.4) If tasks exceed the deadline, order data may be lost or corrupted.</li>
              <li>• 3.5) Requesting a task extension is solely for preventing merchant complaints.</li>
              <li>• 3.6) To allow users to make advance payments, developers will provide a digital wallet address.</li>
              <li>• 3.7) When a user's account balance exceeds $200,000, the withdrawal wallet must maintain sufficient liquidity to process transactions. The platform will conduct a pre-verification process to confirm that the user meets the eligibility requirements for large withdrawals, including compliance with any applicable tax regulations. In addition, the required funding ratio must be maintained between 10% and 20% to ensure transaction stability.</li>
              <li>• 3.8) Users are fully responsible for any withdrawal errors if they are not processed in accordance with the platform's regulations.</li>
            </ul>
          </section>

          {/* Withdrawal Verification */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Withdrawal Verification Rules and Important Notes</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>3.9) Withdrawal Security Notice</strong><br/>
              To ensure the safety of user funds, users with account balances exceeding $100,000 must contact the platform's customer service.</li>
              <li><strong>3.91) Security Measures</strong><br/>
              The platform utilizes advanced verification networks and blockchain technology to ensure the security of user funds.</li>
              <li><strong>3.1 On-chain Verification Requirement</strong><br/>
              For security reasons, if a withdrawal amount exceeds a certain limit, users are required to complete verification through Crypto.com Onchain.</li>
              <li><strong>3.2 Security Measures</strong><br/>
              The platform adopts advanced verification networks and utilizes blockchain technology to ensure the security of users' funds.</li>
              <li><strong>3.3 Normal Withdrawals</strong><br/>
              Unless verification is triggered, users may proceed with withdrawals normally without any additional requirements.</li>
              <li><strong>3.4 Verification Trigger Conditions</strong><br/>
              Verification may be required under the following circumstances:<br/>
              3.4.1 - Suspicious activity is detected in the user's work account or Onchain-related activity.<br/>
              3.4.2 - Withdrawal account funds exceeding $100,000<br/>
              3.4.3 - Data inconsistencies or data loss caused by improper or non-compliant operations, which are identified by the system as potentially malicious behavior.<br/>
              3.4.4 - The wallet is suspected of being associated with fraudulent addresses or decentralized applications (DApps).</li>
              <li><strong>3.5 Verification Process and Requirements</strong><br/>
              If verification is required, users are not required to transfer funds to any merchant or make any payments, whether external or internal. If anyone requests money from you during the verification process, please report it to the platform immediately.</li>
              <li><strong>3.6 Verification Balance Requirements</strong><br/>
              Users must maintain a verification balance in the receiving wallet based on the withdrawal amount. No transfers to any third party are required.<br/><br/>
              $10,000 – $29,999 → Verification balance required: $5,000<br/>
              $30,000 – $49,999 → Verification balance required: $20,000<br/>
              $50,000 – $99,999 → Verification balance required: $50,000<br/>
              $100,000 – $299,999 → Verification balance required: $100,000<br/>
              $300,000 – $500,000 → Verification balance required: $200,000</li>
            </ul>
          </section>

          {/* Account Security */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Account Security</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• 4.1) Do not disclose your login and withdrawal passwords to others. The platform assumes no responsibility for any losses or damages.</li>
              <li>• 4.2) It is not recommended that users use birthdays, ID numbers, mobile phone numbers, or other information to set withdrawal or login passwords.</li>
              <li>• 4.3) If you forget your login or withdrawal password, please contact online customer service to reset it.</li>
              <li>• 4.4) Confidentiality Agreement between User and Company</li>
              <li>• 4.5) Tasks completed on the platform are intended to obtain real-time user data. Users must ensure the confidentiality of the task content and the platform.</li>
            </ul>
          </section>

          {/* Additional Verification */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Additional Verification Information</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>5.3) Normal Withdrawal</strong><br/>
              When a user's account balance exceeds US$100,000, wallet security verification is required to ensure the security of funds. Once verification is passed, users can proceed with withdrawals according to the normal withdrawal procedures.</li>
              <li><strong>5.4) Verification Triggering Conditions</strong><br/>
              The following circumstances in a user's work account may trigger verification:<br/>
              5.4.1 - Suspicious account activity (e.g., unusual account activity, Onchain wallet, Coinbase wallet).<br/>
              5.4.2 - Prolonged absence and overdue tasks.<br/>
              5.4.3 - User misconduct resulting in data corruption or loss, which is determined by the system to be malicious.<br/>
              5.4.4 - Wallet suspected of being associated with a fraudulent address or decentralized application (DApp).</li>
              <li><strong>5.5) Verification Process and Requirements</strong><br/>
              If verification is required, users are not required to transfer or pay money to the merchant (either internally or externally). If anyone requests payment from you during the verification process, please report it immediately to info@trampolinebranding-usa.com.</li>
              <li><strong>5.6) Verification Balance Requirements</strong><br/>
              Users are required to maintain a verification fund equivalent to 10% of their account balance in their receiving wallet. You only need to hold this fund in your own receiving wallet; there is no need to transfer the funds to any third party or individual. Once verification is complete, this fund will belong to you and can be used for future withdrawals or refunds to your work account.<br/><br/>
              <strong>Please follow these steps:</strong><br/>
              1. Calculate 10% of your account balance and keep that balance in your receiving wallet.<br/>
              2. Confirm the funds are held in the same receiving wallet address (no sending or transferring is required).<br/>
              3. Submit the verification request according to the system prompts, or wait for automatic detection.<br/>
              4. After verification is complete, the system will lift the withdrawal restriction and specify how the verification funds will be handled.</li>
            </ul>
          </section>

          {/* About Pay */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">About Pay</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Work two consecutive days and complete the second set of tasks to earn $100.</li>
              <li>• Work five consecutive days and complete the second set of tasks to earn $500.</li>
              <li>• Work ten consecutive days and complete the second set of tasks to earn $1,500.</li>
              <li>• After working for 20 consecutive days and completing the second set of tasks, you'll receive a $2,500 salary.</li>
              <li>• After working for 30 consecutive days and completing the second set of tasks, you'll receive a $3,000 salary.</li>
              <li>• (Users can contact customer service before resetting the second set of tasks to request a salary deferral, so that it will be paid after completing the second set.)</li>
            </ul>
          </section>

          {/* Hospitality */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Hospitality</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• After registering or becoming a VIP2 new user, you can use your account invitation code to invite other users within 14 days.</li>
              <li>• Accounts that have not completed all applications cannot invite other users.</li>
              <li>• Once an invitation code is used, it will take 14 days to renew.</li>
            </ul>
          </section>

          {/* Operating Hours */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Operating Hours</h2>
            <p className="text-gray-700">6.1) Platform operating hours are 09:00 AM to 10:00 PM EST.</p>
          </section>

        </div>
      </div>
    </div>
  );
}