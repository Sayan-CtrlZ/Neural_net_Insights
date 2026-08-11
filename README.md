# Neural Net Insights

Neural Net Insights is an enterprise-grade platform designed to automate machine learning model selection and hyperparameter optimization. By leveraging a distributed Bayesian engine, the system allows users to upload datasets, select target variables, and automatically discover the optimal machine learning architecture for their specific problem space with zero manual configuration.

## System Architecture

The platform operates on a decoupled architecture, ensuring scalability and separation of concerns between the user interface and the computational engine.

### Frontend
- **Framework**: Next.js 15 (React)
- **Styling**: Tailwind CSS with a modern, premium enterprise design language.
- **Interactions**: Framer Motion for fluid transitions and state changes.
- **Data Visualization**: Recharts for real-time telemetry monitoring.
- **Layout Management**: React Resizable Panels for dynamic workspace configuration.

### Backend
- **Framework**: FastAPI (Python) for high-performance asynchronous API endpoints.
- **Optimization Engine**: Optuna (v3) utilizing Tree-structured Parzen Estimator (TPE) for Bayesian optimization.
- **Machine Learning Core**: Scikit-learn and XGBoost.
- **Data Processing**: Pandas for dataset ingestion and manipulation.

### Infrastructure and Storage
- **Database**: Supabase (PostgreSQL) used for both persistent Optuna trial storage and central run registry.
- **Blob Storage**: Supabase Storage for secure, temporary storage of user-uploaded CSV datasets.

## How It Works

The platform abstracts the complexity of building a machine learning pipeline into a streamlined, automated workflow:

1. **Ingestion Layer**: 
   The user uploads a CSV dataset through the web interface. The frontend securely transfers this file to the cloud storage bucket and parses the column headers to allow the user to select the target variable and problem domain (Classification or Regression).

2. **Initialization**: 
   The user configures the desired number of optimization trials (balancing execution speed against exhaustive search accuracy) and initializes the run. A job identifier is generated, and a background task is dispatched to the backend.

3. **Automated Preprocessing**: 
   The backend retrieves the dataset and processes it. The pipeline automatically imputes missing values (median strategy for numeric, most frequent for categorical), scales numeric columns using standard scaling, and applies one-hot encoding to categorical features.

4. **Optimization Protocol**: 
   Optuna explores the hyperparameter space across multiple algorithms:
   - **Classification**: Tests across Logistic Regression, Random Forest Classifier, and XGBoost Classifier.
   - **Regression**: Tests across Linear Regression, Random Forest Regressor, and XGBoost Regressor.
   Each trial is evaluated using 3-fold cross-validation to ensure statistical robustness without sacrificing execution speed.

5. **Telemetry and Reporting**: 
   While the engine runs, the frontend continuously polls the backend API. Results are streamed back to the user in real-time, displaying the progression of the optimization score on a telemetry chart and recording the specific architecture and hyperparameters discovered in the central registry.

## Local Development Setup

To run the platform locally, you will need Node.js and Python installed on your machine, along with a Supabase project for the database and storage requirements.

### 1. Supabase Configuration
Create a new Supabase project and execute the SQL policy file located in the backend directory (`rls_policies.sql`) to set up the necessary tables (`runs`) and storage buckets (`datasets`). Ensure you retrieve your Project URL, Anon Key, and database connection string.

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory containing your PostgreSQL connection string:
```text
SUPABASE_DB_URI=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install the dependencies:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory with your Supabase credentials:
```text
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

Start the Next.js development server:
```bash
npm run dev
```
The frontend will be accessible at `http://localhost:3000`.

## Usage Guidelines

1. Access the application at `http://localhost:3000` and click "Start Optimizing".
2. In the Ingestion Module, upload a well-formatted CSV file.
3. Select the column you wish to predict from the Target Variable dropdown.
4. Select the appropriate domain (Class for categorical targets, Regress for continuous numerical targets).
5. Adjust the Optimization Trials slider based on your accuracy requirements.
6. Click "Initialize Run" and monitor the Telemetry and Registry modules for the automated results.
